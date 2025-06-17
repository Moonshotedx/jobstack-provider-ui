import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { createOrganisation } from "@/lib/auth-client"
import { Input } from "../ui/input"
import { toast } from "sonner"

const FormSchema = z.object({
  name: z
    .string().nonempty('Enter Organisation Name'),
  slug: z.string().nonempty(
    'Enter Unique Identifier'
  ),
  logo: z.string().url().optional()
})

export function CreateOrg() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      await createOrganisation(data)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Organisation Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Organisation Identifier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Logo Url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Org</Button>
      </form>
    </Form>
  )
}
