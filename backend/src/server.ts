import dotenv from "dotenv";
import app from "./app";
import { startEmailWorker } from "./config/bullmq";

dotenv.config(); // make sure env is loaded

const PORT = Number(process.env.PORT || 4000);

function bootstrap() {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Start BullMQ worker
  startEmailWorker();
}

bootstrap();
