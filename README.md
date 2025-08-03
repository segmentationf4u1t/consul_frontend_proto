# Consul Wallboard Frontend

A real-time dashboard built with Next.js and Shadcn/UI to visualize wallboard data from the [Consul Stack Wallboard API](https://github.com/segmentationf4u1t/consul_backend_proto).

## Features

- **Real-Time Data**: Connects to the backend's Server-Sent Events (SSE) endpoint to display live data without needing to refresh the page.
- **Predictive Forecasting**: The campaigns table includes a "Prognoza" (Forecast) column that shows the predicted total calls for the day, with an animated progress bar to track real-time progress.
- **Metric Cards**: Displays high-level panel data (Queue, Logged In, Ready, etc.) in animated cards that highlight when values change.
- **Campaign Table**: Shows a detailed breakdown of all active campaigns in a clean, sortable table.
- **Connection Status**: A clear indicator shows the current connection status to the backend (connected, reconnecting, or error).
- **Graceful Error Handling**: If the backend is unavailable, the dashboard displays a clear error message without crashing.
- **Responsive Design**: The layout is fully responsive and works on desktop and mobile devices.
- **Theming**: Includes a light/dark mode toggle.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI**: [Shadcn/UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (as the package manager/runtime)
- A running instance of the [Consul Stack Wallboard API](https://github.com/segmentationf4u1t/consul_backend_proto) on `http://localhost:3000`.

### Installation

1.  Clone the repository:
    ```bash
    git clone git@github.com:segmentationf4u1t/consul_frontend_proto.git
    cd consul_frontend_proto
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

### Running the Development Server

To start the development server, run:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

The page will automatically connect to the backend API and start displaying data.
