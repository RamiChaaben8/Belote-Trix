import { createServer } from "http";
import next from "next";
import { attachSocketServer } from "./src/socket/server";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  attachSocketServer(server);
  server.listen(port, "0.0.0.0", () => {
    console.log(`> Belote Trix ready on http://localhost:${port}`);
  });
});
