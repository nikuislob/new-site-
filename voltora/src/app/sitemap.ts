import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/stadium", "/checkout", "/find-ticket"];
  return routes.map((route) => ({
    url: absoluteUrl(route || "/"),
    lastModified: new Date(),
  }));
}
