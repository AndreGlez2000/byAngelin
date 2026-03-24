export const dynamic = "force-dynamic";
import { getServicesWithProducts, getProducts } from "@/lib/queries";
import { ServiciosClient } from "./_components/ServiciosClient";

export default async function ServiciosPage() {
  const [services, products] = await Promise.all([
    getServicesWithProducts(),
    getProducts(),
  ]);
  return (
    <ServiciosClient initialServices={services} initialProducts={products} />
  );
}
