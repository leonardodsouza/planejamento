import { redirect } from "next/navigation";

// Endereço antigo: "Modelos" agora fica em "Projetos".
export default function ModelosRedirect() {
  redirect("/projetos");
}
