# Portfolio

The portfolio site of Harun R. Rayhan, showcasing skills, experience, and projects.

## Technologies Used

This project utilizes a variety of modern technologies for both the backend and frontend:

- **Backend:** Laravel 11.x
- **Frontend:** React.js
- **Interactivity:** Inertia.js to seamlessly connect the backend and frontend.
- **UI Components:** shadcn/ui for beautifully designed UI components.

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

## Contributing

Contributions are welcome! Please submit a pull request to the `dev` branch for any changes or enhancements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
