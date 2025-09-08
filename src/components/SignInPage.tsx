import * as Checkbox from "@radix-ui/react-checkbox";
import * as Form from "@radix-ui/react-form";
import { CheckIcon, GitHubLogoIcon, LockClosedIcon } from "@radix-ui/react-icons";
import * as Label from "@radix-ui/react-label";
import * as Separator from "@radix-ui/react-separator";
import { Button, Card, Flex, Text, TextField } from "@radix-ui/themes";
import { useId, useState } from "react";

interface SignInPageProps {
  onGoogleSignIn: () => void;
}

export function SignInPage({ onGoogleSignIn }: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // For now, just trigger Google sign-in since we only support OAuth
    onGoogleSignIn();
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      p="4"
    >
      <Flex direction="column" width="100%" style={{ maxWidth: "28rem" }}>
        {/* Logo */}
        <Flex justify="center" mb="8">
          <Flex
            align="center"
            justify="center"
            width="48px"
            height="48px"
          >
            <LockClosedIcon width="32" height="32" color="white" />
          </Flex>
        </Flex>

        {/* Title */}
        <Text size="6" weight="medium" align="center" mb="8">
          Sign in to your account
        </Text>

        {/* Sign-in Form */}
        <Card>
          <Form.Root onSubmit={handleSubmit}>
            <Flex direction="column" gap="6">
              {/* Email Field */}
              <Form.Field name="email">
                <Flex direction="column" gap="2">
                  <Label.Root htmlFor={emailId}>
                    <Text size="2" weight="medium">
                      Email address
                    </Text>
                  </Label.Root>
                  <Form.Control asChild>
                    <TextField.Root
                      id={emailId}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      size="3"
                    />
                  </Form.Control>
                </Flex>
              </Form.Field>

              {/* Password Field */}
              <Form.Field name="password">
                <Flex direction="column" gap="2">
                  <Label.Root htmlFor={passwordId}>
                    <Text size="2" weight="medium">
                      Password
                    </Text>
                  </Label.Root>
                  <Form.Control asChild>
                    <TextField.Root
                      id={passwordId}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      size="3"
                    />
                  </Form.Control>
                </Flex>
              </Form.Field>

              {/* Remember Me and Forgot Password */}
              <Flex align="center" justify="between">
                <Flex align="center" gap="2">
                  <Checkbox.Root
                    id={rememberId}
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  >
                    <Checkbox.Indicator>
                      <CheckIcon width="12" height="12" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label.Root htmlFor={rememberId}>
                    <Text size="2" color="gray">
                      Remember me
                    </Text>
                  </Label.Root>
                </Flex>

                <Button type="button" variant="ghost" size="1" color="blue">
                  Forgot password?
                </Button>
              </Flex>

              {/* Sign In Button */}
              <Form.Submit asChild>
                <Button type="submit" size="3" style={{ width: "100%" }}>
                  Sign in
                </Button>
              </Form.Submit>
            </Flex>
          </Form.Root>

          {/* Separator */}
          <Flex align="center" my="6">
            <Separator.Root style={{ flex: 1 }} />
            <Text size="2" color="gray" style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem" }}>
              Or continue with
            </Text>
            <Separator.Root style={{ flex: 1 }} />
          </Flex>

          {/* OAuth Buttons */}
          <Flex gap="3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <Button type="button" variant="outline" onClick={onGoogleSignIn} size="3">
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: "8px" }} aria-label="Google logo">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button type="button" variant="outline" size="3">
              <GitHubLogoIcon width="20" height="20" style={{ marginRight: "8px" }} />
              GitHub
            </Button>
          </Flex>
        </Card>

        {/* Sign Up Link */}
        <Text align="center" size="2" color="gray" mt="6">
          Not a member?{" "}
          <Button type="button" variant="ghost" size="1" color="blue">
            Start a 14 day free trial
          </Button>
        </Text>
      </Flex>
    </Flex>
  );
}
