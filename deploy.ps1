# Deployment Script for VibePlaylist AI
$ErrorActionPreference = "Stop"

$AWS_PROFILE = "account2"
$STACK_NAME = "vibeplaylist-ai"
$REGION = "us-east-1" # Can be changed if needed

Write-Host "Verifying AWS Profile '$AWS_PROFILE'..." -ForegroundColor Cyan
$identity = aws sts get-caller-identity --profile $AWS_PROFILE | ConvertFrom-Json
if (-not $identity) {
    Write-Host "Error: Could not verify AWS profile $AWS_PROFILE. Make sure it is configured correctly." -ForegroundColor Red
    exit 1
}
Write-Host "Connected as Account: $($identity.Account), ARN: $($identity.Arn)" -ForegroundColor Green

# Read Groq API Key
$GROQ_API_KEY = $env:GROQ_API_KEY
if ([string]::IsNullOrWhiteSpace($GROQ_API_KEY)) {
    $GROQ_API_KEY = Read-Host -Prompt "Enter your Groq API Key"
}
if ([string]::IsNullOrWhiteSpace($GROQ_API_KEY)) {
    Write-Host "Error: Groq API Key is required." -ForegroundColor Red
    exit 1
}

Write-Host "`nPackaging and Deploying CloudFormation Stack..." -ForegroundColor Cyan

# We use sam or aws cloudformation package to handle local code artifacts if needed
# But standard aws cloudformation package needs an S3 bucket.
# Let's create an artifact bucket if it doesn't exist.
$ARTIFACT_BUCKET = "$STACK_NAME-artifacts-$($identity.Account)"

try {
    $null = aws s3api head-bucket --bucket $ARTIFACT_BUCKET --profile $AWS_PROFILE 2>&1
} catch {
    Write-Host "Creating artifact bucket $ARTIFACT_BUCKET..."
    aws s3 mb s3://$ARTIFACT_BUCKET --profile $AWS_PROFILE
}

Write-Host "Packaging template..."
aws cloudformation package `
    --template-file infrastructure.yaml `
    --s3-bucket $ARTIFACT_BUCKET `
    --output-template-file packaged.yaml `
    --profile $AWS_PROFILE

Write-Host "Deploying stack $STACK_NAME..."
aws cloudformation deploy `
    --template-file packaged.yaml `
    --stack-name $STACK_NAME `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides GroqApiKey="$GROQ_API_KEY" `
    --profile $AWS_PROFILE

Write-Host "`nRetrieving Outputs..." -ForegroundColor Cyan
$outputs = aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs" --profile $AWS_PROFILE | ConvertFrom-Json

$FrontendBucket = ($outputs | Where-Object OutputKey -eq 'FrontendBucketName').OutputValue
$ApiURL = ($outputs | Where-Object OutputKey -eq 'ApiURL').OutputValue
$WebsiteURL = ($outputs | Where-Object OutputKey -eq 'WebsiteURL').OutputValue

Write-Host "Frontend Bucket: $FrontendBucket"
Write-Host "API URL: $ApiURL"
Write-Host "Website URL: $WebsiteURL"

Write-Host "`nUpdating frontend script.js with API URL..." -ForegroundColor Cyan
$scriptContent = Get-Content -Path .\frontend\script.js -Raw
$scriptContent = $scriptContent -replace 'const API_URL = ".*?";', "const API_URL = `"$ApiURL`";"
Set-Content -Path .\frontend\script.js -Value $scriptContent

Write-Host "`nUploading frontend assets to S3..." -ForegroundColor Cyan
aws s3 sync .\frontend\ s3://$FrontendBucket --profile $AWS_PROFILE

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "Visit your site at: $WebsiteURL" -ForegroundColor Yellow
