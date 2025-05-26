# Portfolio

[![Deploy](https://github.com/HarunRRayhan/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/HarunRRayhan/portfolio/actions/workflows/deploy.yml)

The portfolio site of Harun R. Rayhan, showcasing skills, experience, and projects.

## Technologies Used

This project utilizes a variety of modern technologies for both the backend and frontend:

- **Backend:** Laravel 11.x
- **Frontend:** React.js
- **Interactivity:** Inertia.js to seamlessly connect the backend and frontend.
- **UI Components:** shadcn/ui for beautifully designed UI components.
- **Email Service:** Resend for reliable email delivery

## Installation Instructions

To set up the project locally, please follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/harunrrayhan/portfolio.git
   cd portfolio
   ```

2. Install the required dependencies using Composer for the backend:
   ```bash
   composer install
   ```

3. Install Node.js dependencies for the frontend:
   ```bash
   npm install
   ```

4. Create a `.env` file and set your environment configurations (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```

5. Generate the application key:
   ```bash
   php artisan key:generate
   ```

6. Run your database migrations:
   ```bash
   php artisan migrate
   ```

7. Start the local development server:
   ```bash
   php artisan serve
   ```

8. Access the application by navigating to [http://localhost:8000](http://localhost:8000) in your web browser.

## Usage

This portfolio showcases Harun R. Rayhan's services as a DevOps Engineer, Cloud Engineer, and AWS Expert, reflecting his expertise and experience in software engineering.

## Deployment

This project uses a **blue-green zero-downtime deployment** strategy with GitHub Actions for CI/CD.

### Automatic Deployment

Deployments are triggered automatically on:
- **Push Events**: Direct pushes to `main` or `features/deploy-with-traefik` branches
- **Pull Request Merges**: When pull requests are merged into `main` branch
- **Manual Dispatch**: Manual workflow trigger via GitHub UI

The system includes intelligent logic to only deploy on actual PR merges, not just closed pull requests.

### Manual Deployment

You can also deploy manually using the deployment scripts:

```bash
# Check current deployment status
./deploy/cicd/status.sh

# Deploy to opposite environment (automatic detection)
./deploy/cicd/blue-green-deploy.sh

# Deploy to specific environment
./deploy/cicd/blue-green-deploy.sh blue
./deploy/cicd/blue-green-deploy.sh green
```

### Infrastructure

- **Production URL**: https://harun.dev
- **Deployment Strategy**: Blue-Green with Traefik load balancer
- **Container Orchestration**: Docker Compose
- **SSL/TLS**: Automatic Let's Encrypt certificates
- **CDN**: Cloudflare
- **Triggers**: Push, PR merge, and manual dispatch

For detailed deployment documentation, see [deploy/cicd/README-BLUE-GREEN.md](deploy/cicd/README-BLUE-GREEN.md).

## Contributing

Contributions are welcome! Please submit a pull request to the `dev` branch for any changes or enhancements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
