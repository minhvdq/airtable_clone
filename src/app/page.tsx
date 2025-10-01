import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import MainPage from "~/app/_components/home/MainPage";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }else{
    redirect('/signin')
  }

  return (
    <HydrateClient>
      <MainPage />
    </HydrateClient>
  );
}
