import WebSocket from "ws";

const WS_URL = "ws://localhost:3001/ws";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJyb2xlIjoiVVNFUiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImVtYWlsVmVyaWZpZWQiOnRydWUsImlhdCI6MTc4MDMwMjk5MiwiZXhwIjoxNzgwMzAzODkyfQ.dBzzeiq0bTJqrAGeRaEU1aQPAJBuvn_gCVHhbjjF4c4";

async function main() {
  console.log(`Connecting to WebSocket server at ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    console.log("Connected! Sending authentication message...");
    ws.send(JSON.stringify({ action: "auth", token }));
  });

  ws.on("message", (data) => {
    console.log("Received raw message:", data.toString());
    const msg = JSON.parse(data.toString());

    if (msg.type === "auth" && msg.status === "success") {
      console.log("Authentication successful! Subscribing to AAPL quotes...");
      ws.send(JSON.stringify({ action: "subscribe", symbols: ["AAPL"] }));
    } else if (msg.type === "quote") {
      console.log(`📈 Quote Received: ${msg.symbol} | Price: $${msg.price.toFixed(2)} | Change: ${msg.change.toFixed(2)}%`);
    }
  });

  ws.on("close", (code, reason) => {
    console.log(`Connection closed. Code: ${code}, Reason: ${reason}`);
  });

  ws.on("error", (err) => {
    console.error("WebSocket Client Error:", err);
  });

  // Let it run for 15 seconds to receive real-time quotes, then close
  setTimeout(() => {
    console.log("Closing connection after 15 seconds...");
    ws.close();
  }, 15000);
}

main().catch(console.error);
