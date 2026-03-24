export const dynamic = "force-dynamic";
import { getProducts } from "@/lib/queries";
import { InventarioClient } from "./_components/InventarioClient";

export default async function InventarioPage() {
  const products = await getProducts();
  return <InventarioClient initialProducts={products} />;
}
