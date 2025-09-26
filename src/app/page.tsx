import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import MainPage from "./_components/home/MainPage";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }else{
    redirect('/signin')
  }

  return (
    <HydrateClient>
      {/* Updated to a cleaner, light-themed background and centered content */}
      <main className="flex min-h-screen flex-col items-center bg-white text-black">
        <MainPage/>
      </main>
    </HydrateClient>
  );
}
