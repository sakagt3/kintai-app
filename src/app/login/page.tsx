/** ログインはトップページ (/) で行うため、/login は / へリダイレクト */
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/");
}
