/** トップページ: 未認証時はログイン画面へリダイレクト */
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
