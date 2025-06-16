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
/* import { useEffect } from "react"; */
/* import { doesSessionExist } from "@/lib/utils"; */
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const SignUpSchema = z.object({
  firstName: z.string().nonempty().describe('Enter First Name'),
  surname: z.string().nonempty().describe('Enter Surname'),
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

const Auth = () => {
  const { action } = useParams({ from: '/auth/$action' });
  const isSignUp = action.toLowerCase() === 'signup';
  const router = useRouter();
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInputs | SignInInputs>({
    resolver: zodResolver(isSignUp ? SignUpSchema : SignInSchema),
  });

  const onSubmit = async (data: SignUpInputs | SignInInputs) => {
    if (isSignUp) {
      const input: SignUpInputs = data as SignUpInputs
      const name = input.firstName.trim() + " " + input.surname.trim()
      const signUpRequest = await authClient.signUp.email({ name, email: input.email, password: input.password })
      if (signUpRequest.data) {
        navigate({ to: '/profile' })
      } else if (signUpRequest.error) {
        toast.error(signUpRequest.error.message)
      }
    } else {
      const loginRequest = await authClient.signIn.email({ email: data.email, password: data.password })
      if (loginRequest.data) {
        navigate({ to: '/profile' })
      } else if (loginRequest.error) {
        toast.error(loginRequest.error.message)
      }
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
              {isSignUp ? <div className="grid gap-2">
                <Label htmlFor="first-name">Name</Label>
                <div    >
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="First Name"
                    {...register("firstName")}
                  />
                  {(errors as any).firstName && <span className="text-sm text-destructive">{(errors as any).firstName.message}</span>}
                </div>
                <div>
                  <Input
                    id="surname"
                    type="text"
                    placeholder="Surname"
                    {...register("surname")}
                  />
                  {(errors as any).surname && <span className="text-sm text-destructive">{(errors as any).surname.message}</span>}
                </div>
              </div> : <></>
              }
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
                  placeholder="Enter Password"
                  {...register("password")}
                />
                {errors.password && <span className="text-sm text-destructive">{errors.password.message}</span>}

                {isSignUp && (
                  <>
                    <Label htmlFor="confirmPassword">Re Enter Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re Enter Password"
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

