import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useUserSession } from '@/hooks/useUserSession'
import { SelectOrg } from '@/components/organisation/SelectOrg'
import { CreateOrg } from '@/components/organisation/CreateOrg'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

function RouteComponent() {

  const { data, isLoading, error } = useUserSession();

  if (isLoading) return <div>Loading user data...</div>;
  if (error) return <div>Error loading user data {data && data.name}</div>;

  return <div>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Available Jobs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className='p-4 shadow'>
            <SelectOrg />
          </div>
          <div className='p-4 shadow'>
            <CreateOrg />
          </div>
          {/* <div className="grid auto-rows-min gap-4 md:grid-cols-5"> */}
          {/*   {Array.from({ length: 20 }).map((_, i) => ( */}
          {/*     <div key={i} className="bg-muted/50 aspect-square rounded-xl" /> */}
          {/*   ))} */}
          {/* </div> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  </div>
}
