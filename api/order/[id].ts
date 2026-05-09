import { head } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ID_REGEX = /^[a-f0-9]{10}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!ID_REGEX.test(id)) {
    res.status(400).send("Invalid id");
    return;
  }

  try {
    const [panelHead, thumbHead] = await Promise.all([
      head(`orders/${id}/panel.json`),
      head(`orders/${id}/thumb.png`),
    ]);

    const metadataResponse = await fetch(panelHead.url);
    if (!metadataResponse.ok) {
      res.status(404).send("Order not found");
      return;
    }
    const metadata = await metadataResponse.json();

    res.status(200).json({
      id,
      panelUrl: panelHead.url,
      thumbnailUrl: thumbHead.url,
      ...metadata,
    });
  } catch {
    res.status(404).send("Order not found");
  }
}
