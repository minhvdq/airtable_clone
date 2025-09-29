import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default async function AuthWrapper({ children }: AuthWrapperProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  return <>{children}</>;
}
