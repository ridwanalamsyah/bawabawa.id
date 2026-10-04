import { redirect } from "next/navigation";

// The old "CMS" hub; everything it linked to now lives in the main menu.
export default function CMSPage() {
  redirect("/admin/settings");
}
