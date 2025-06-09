import { signUp, doesEmailExist, signIn } from "supertokens-web-js/recipe/emailpassword";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect } from "react";
import { doesSessionExist } from "@/lib/utils";

const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpInputs = z.infer<typeof SignUpSchema>;
type SignInInputs = z.infer<typeof SignInSchema>;

async function handleSignUp(email: string, password: string) {
  try {
    const emailCheck = await doesEmailExist({ email });
    if (emailCheck.doesExist) {
      toast.warning("Email already exists. Please sign in instead");
    } else {
      const response = await signUp({
        formFields: [
          { id: "email", value: email },
          { id: "password", value: password }
        ]
      });

      if (response.status === "FIELD_ERROR") {
        response.formFields.forEach(f => toast.error(f.error));
      } else if (response.status === "SIGN_UP_NOT_ALLOWED") {
        toast.error(response.reason);
      } else {
        window.location.href = "/profile";
      }
    }
  } catch (err: any) {
    toast.error(err?.message ?? "Something went wrong.");
  }
}

async function handleSignIn(email: string, password: string) {
  try {
    const response = await signIn({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password }
      ]
    });

    if (response.status === "FIELD_ERROR") {
      response.formFields.forEach(f => toast.error(f.error));
    } else if (response.status === "WRONG_CREDENTIALS_ERROR") {
      toast.error("Email/password is incorrect.");
    } else if (response.status === "SIGN_IN_NOT_ALLOWED") {
      toast.error(response.reason);
    } else {
      window.location.href = "/homepage";
    }
  } catch (err: any) {
    toast.error(err?.message ?? "Something went wrong.");
  }
}

const Auth = () => {
  const { action } = useParams({ from: '/auth/$action' });
  const isSignUp = action.toLowerCase() === 'signup';
  const router = useRouter();
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const session = await doesSessionExist()
      if (session) {
        navigate({ to: '/profile' })
      }
    }
    checkSession()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInputs | SignInInputs>({
    resolver: zodResolver(isSignUp ? SignUpSchema : SignInSchema),
  });

  const onSubmit = async (data: SignUpInputs | SignInInputs) => {
    if (isSignUp) {
      await handleSignUp(data.email, data.password);
    } else {
      await handleSignIn(data.email, data.password);
    }
  };

  return (
    <div className="w-dvw h-dvh bg-amber-100 flex justify-center items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <span className="capitalize">
              {isSignUp ? "Sign Up" : "Login"} to your account
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && <span className="text-sm text-destructive">{errors.password.message}</span>}

                {isSignUp && (
                  <>
                    <Label htmlFor="confirmPassword">Re-enter Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                    />
                    {(errors as any).confirmPassword && <span className="text-sm text-destructive">{(errors as any).confirmPassword.message}</span>}
                  </>
                )}
              </div>

              <Button type="submit" className="w-full">
                <span className="capitalize">{isSignUp ? "Sign Up" : "Login"}</span>
              </Button>
              <p className="w-full text-center text-primary">or</p>
              <Button
                className="-mt-2 underline hover:no-underline"
                variant="link"
                onClick={() =>
                  router.navigate({
                    to: `/auth/${isSignUp ? "login" : "signup"}`,
                  })
                }
              >
                <span className="capitalize">
                  {isSignUp ? "Login" : "Sign Up"}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
