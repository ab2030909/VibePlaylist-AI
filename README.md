# VibePlaylist AI 🎵

Turn a feeling into a playlist. Describe your moment, discover your vibe, and let AI generate a creative themed playlist just for you.

## Features

- **Mood to Playlist**: Enter any situation, place, memory, or activity to get a custom playlist.
- **Vibe Selection**: Choose from 7 distinct vibes (Chill, Romantic, Sad, Energetic, Dreamy, Nostalgic, Focus).
- **AI-Powered**: Uses Groq API to intelligently curate 8 real tracks.
- **Minimalist Design**: Premium cinematic black and gold interface.
- **Copy & Share**: Easily copy your generated playlist to the clipboard.
- **Fully Serverless**: Powered by AWS Lambda, API Gateway, S3, and CloudFront.

## Architecture

```mermaid
flowchart TD
    User([User]) -->|HTTPS Request| CloudFront[AWS CloudFront]
    CloudFront -->|Fetches Static Assets| S3[AWS S3 Bucket]
    
    User -->|POST /generate| APIGW[AWS API Gateway]
    APIGW -->|Invokes| Lambda[AWS Lambda (Node.js)]
    Lambda -->|LLM Prompt| Groq[Groq API]
    
    Groq -.->|Returns JSON| Lambda
    Lambda -.->|Returns Playlist| APIGW
    APIGW -.->|Displays Playlist| User
```

## AWS Services

- **Amazon S3**: Hosts the static frontend files (HTML, CSS, JS).
- **Amazon CloudFront**: Global CDN distributing the frontend securely via HTTPS and caching static content.
- **Amazon API Gateway**: Provides the REST API endpoint (`/generate`) to trigger the backend logic.
- **AWS Lambda**: Executes the Node.js backend logic to securely communicate with the Groq API.
- **AWS IAM**: Manages security permissions for Lambda execution and S3 bucket access.
- **AWS CloudFormation**: Defines the entire infrastructure as code, ensuring repeatable and consistent deployments.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Backend**: Node.js, AWS Lambda
- **Infrastructure**: AWS CloudFormation (YAML)
- **AI**: Groq API (Llama 3 Model)

## Local Development

To run the frontend locally:
1. Clone this repository.
2. Open `frontend/index.html` in your browser.
3. For local backend testing, you will need to set up a local Node server or test the Lambda handler directly, but the app is designed to be deployed to AWS.

## AWS Deployment

This project uses AWS CloudFormation and strictly targets the `account2` AWS CLI profile.

### Prerequisites
- AWS CLI configured with a profile named `account2`.
- A Groq API Key.

### Deployment Command

Run the deployment script from the project root:

```powershell
.\deploy.ps1
```

The script will:
1. Verify that `account2` is being used (`aws sts get-caller-identity --profile account2`).
2. Ask for your Groq API Key.
3. Package the CloudFormation template and create an artifact bucket if needed.
4. Deploy the infrastructure.
5. Retrieve stack outputs and automatically update the frontend `script.js` with the API URL.
6. Sync the frontend files to the deployed S3 bucket.

*If you prefer doing it manually, ensure you append `--profile account2` to every `aws cloudformation` and `aws s3` command.*

## Cleanup

To completely remove the deployed resources from AWS:

```bash
# Empty the S3 bucket first
aws s3 rm s3://<YOUR_FRONTEND_BUCKET_NAME> --recursive --profile account2

# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name vibeplaylist-ai --profile account2
```
