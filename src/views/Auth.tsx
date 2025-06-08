import { signUp, doesEmailExist, signIn } from "supertokens-web-js/recipe/emailpassword";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type FormEvent, useState } from "react";
import { useParams, useRouter } from "@tanstack/react-router";

async function handleSignUp(email: string, password: string) {
  try {
    let response = await doesEmailExist({
      email
    });

    if (response.doesExist) {
      window.alert("Email already exists. Please sign in instead")
    }
  } catch (err: any) {
    if (err.isSuperTokensGeneralError === true) {
      // this may be a custom error message sent from the API by you.
      window.alert(err.message);
    } else {
      window.alert("Oops! Something went wrong.");
    }
  }
  try {
    let response = await signUp({
      formFields: [{
        id: "email",
        value: email
      }, {
        id: "password",
        value: password
      }]
    })

    if (response.status === "FIELD_ERROR") {
      response.formFields.forEach(formField => {
        if (formField.id === "email") {
          window.alert(formField.error)
        } else if (formField.id === "password") {
          window.alert(formField.error)
        }
      })
    } else if (response.status === "SIGN_UP_NOT_ALLOWED") {
      window.alert(response.reason)
    } else {
      window.location.href = "/homepage"
    }
  } catch (err: any) {
    if (err.isSuperTokensGeneralError === true) {
      window.alert(err.message);
    } else {
      window.alert("Oops! Something went wrong.");
    }
  }
}

async function handleSignIn(email: string, password: string) {
  try {
    let response = await signIn({
      formFields: [{
        id: "email",
        value: email
      }, {
        id: "password",
        value: password
      }]
    })

    if (response.status === "FIELD_ERROR") {
      response.formFields.forEach(formField => {
        if (formField.id === "email") {
          // Email validation failed (for example incorrect email syntax).
          window.alert(formField.error)
        }
      })
    } else if (response.status === "WRONG_CREDENTIALS_ERROR") {
      window.alert("Email password combination is incorrect.")
    } else if (response.status === "SIGN_IN_NOT_ALLOWED") {
      // the reason string is a user friendly message
      // about what went wrong. It can also contain a support code which users
      // can tell you so you know why their sign in was not allowed.
      window.alert(response.reason)
    } else {
      // sign in successful. The session tokens are automatically handled by
      // the frontend SDK.
      window.location.href = "/homepage"
    }
  } catch (err: any) {
    if (err.isSuperTokensGeneralError === true) {
      // this may be a custom error message sent from the API by you.
      window.alert(err.message);
    } else {
      window.alert("Oops! Something went wrong.");
    }
  }
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter()
  const { action } = useParams({ from: '/auth/$action' })
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    action.toLowerCase() === 'signup' ?
      await handleSignUp(email, password)
      : await handleSignIn(email, password)
  };

  return (
    <div className="w-dvw h-dvh bg-amber-100 flex justify-center items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle> <span className="capitalize">{action.toLowerCase() === 'signup' ? "Sign Up" : "Login"}</span> to your account</CardTitle>
          <CardDescription>
            Enter your email below to {action.toLowerCase()} to your account
          </CardDescription>
          <CardAction>
            <Button variant="link" onClick={() => {
              router.navigate({ to: `/auth/${action.toLowerCase() === 'signup' ? "login" : "signup"}` })
            }}><span className="capitalize">{action.toLowerCase() === 'signup' ? "Login" : "Sign Up"}</span></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {action.toLowerCase() === 'signup' ? <>
                  <Label htmlFor="reenter-password"> ReEnter Password</Label>
                  <Input
                    id="reenter-password"
                    type="reenter-password"
                    required
                  /* value={password} */
                  /* onChange={(e) => setPassword(e.target.value)} */
                  />
                </> : <></>}
              </div>
              <Button type="submit" className="w-full">
                <span className="capitalize"> {action.toLowerCase() === 'signup' ? "Sign Up" : "Login"} </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth
