import { useSession } from "next-auth/react";
import { type FormEvent, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { api } from "y/utils/api";

function updateTextAreaSize(ctx?: HTMLTextAreaElement) {
  if (ctx == null) return;
  ctx.style.height = "0";
  ctx.style.height = `${ctx.scrollHeight}px`;
}

function Form() {
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>();

  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaSize(textArea);
    textAreaRef.current = textArea;
  }, []);

  useLayoutEffect(() => {
    updateTextAreaSize(textAreaRef?.current);
  }, [inputValue]);

  const createTweet = api.tweet.create.useMutation({
    onSuccess: (newTweet) => {
      console.log(newTweet);
      setInputValue("");
    },
  });

  if (session.status !== "authenticated") return;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    createTweet.mutate({ content: inputValue });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex gap-4">
        <ProfileImage src={session.data.user.image} />
        <textarea
          ref={inputRef}
          className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
          placeholder="What's happening?"
          style={{ height: 0 }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <Button className="self-end">Tweet</Button>
    </form>
  );
}

export function NewTweetForm() {
  const session = useSession();
  if (session.status !== "authenticated") return;

  return <Form />;
}
