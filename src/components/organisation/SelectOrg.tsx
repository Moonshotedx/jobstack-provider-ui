import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

const FormSchema = z.object({
  orgId: z
    .string({
      required_error: "Please select an org",
    }).length(32),
})

export function SelectOrg() {
  const orgList = useQuery({
    queryKey: ['Fetch-Org-List'],
    queryFn: async () => {
      const orgList = await authClient.organization.list()
      if (orgList.error) {
        throw Error(orgList.error.message)
      }
      return orgList.data
    },
    staleTime: 5000
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const active = await authClient.organization.setActive({ organizationId: data.orgId })
    if (active.data) {
      toast.success(`organisation ${active.data.name} is selected as active`)
    } else if (active.error) {
      toast.error(active.error.message)
    }
  }

  return (
    <Form {...form}>
      <FormDescription>Lists User's Organisations</FormDescription>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="orgId"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organisation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {
                    orgList.data?.map((data) => {
                      return (<SelectItem value={data.id}>
                        {data.name} - {data.slug}
                      </SelectItem>)
                    })
                  }
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Set as Active Org</Button>
      </form>
    </Form>
  )
}
