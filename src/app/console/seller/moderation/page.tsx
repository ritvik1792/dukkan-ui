import { sellerConsolePath } from "@/lib/routes";
import { redirect } from "next/navigation";

export default function SellerModerationRedirect() {
  redirect(`${sellerConsolePath("/tickets")}?tab=blocked`);
}
