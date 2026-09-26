import { adminConsolePath } from "@/lib/routes";
import { redirect } from "next/navigation";

export default function AdminModerationRedirect() {
  redirect(`${adminConsolePath("/tickets")}?tab=blocked`);
}
