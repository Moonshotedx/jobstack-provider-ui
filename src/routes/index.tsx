import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    /* const session = await doesSessionExist() */
    /* if (session) { */
    /*   window.location.replace(`/profile`); */
    /* } */
  },
  component: App,
})

function App() {
  return (
    <div className="text-center">
      Hello, Is this you?
    </div>
  )
}
