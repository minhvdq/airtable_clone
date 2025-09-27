import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import WorkspacesPage from "~/app/_components/Workspaces/WorspacesPage";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }else{
    redirect('/signin')
  }

  return (
    <HydrateClient>
        <WorkspacesPage />
    </HydrateClient>
  );
}
