import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { getCurrentUser } from '@/modules/auth/actions';
import CreateProblemForm from '@/modules/problems/components/create-problem-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react'

export const dynamic = "force-dynamic";

const CreateProblemPage = async() => {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/sign-in");
    }

    if (user.role !== "ADMIN") {
      redirect("/problems");
    }

  return (
    <section className='flex flex-col items-center justify-center container mx-4 my-4'>
        <div className='flex flex-row justify-between items-center w-full'>
            <Link href={"/"}>
            <Button variant={"outline"} size={"icon"}>
                <ArrowLeft className='size-4' />
            </Button>
            </Link>

             <h1 className='text-3xl font-bold text-amber-400'>Welcome {user?.firstName || "Developer"}! Create a Problem</h1>
        <ModeToggle/>
        </div>
       <CreateProblemForm/>
    </section>
  )
}

export default CreateProblemPage
