import InfiniteScroll from "react-infinite-scroll-component";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProfileImage } from "./ProfileImage";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "y/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; image: string | null; name: string | null };
};

type InfiniteTweetListProps = {
  isLoading: boolean;
  isError: boolean;
  hasMore?: boolean;
  fetchNewTweets: () => Promise<unknown>;
  tweets?: Tweet[];
};

export function InfiniteTweetList({
  tweets,
  isError,
  isLoading,
  fetchNewTweets,
  hasMore = false,
}: InfiniteTweetListProps) {
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <h1>Error...</h1>;

  if (tweets == null || tweets.length === 0) {
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
    );
  }

  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={hasMore}
        loader={<LoadingSpinner />}
      >
        {tweets.map((tweet) => {
          return <TweetCard key={tweet.id} {...tweet} />;
        })}
      </InfiniteScroll>
    </ul>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

function TweetCard({
  id,
  user,
  content,
  createdAt,
  likeCount,
  likedByMe,
}: Tweet) {
  const trpcUtils = api.useContext();
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (!oldData) return;

        const countModifier = addedLike ? 1 : -1;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((tweet) => {
                if (tweet.id === id) {
                  return {
                    ...tweet,
                    likeCount: tweet.likeCount + countModifier,
                    likedByMe: addedLike,
                  };
                }

                return tweet;
              }),
            };
          }),
        };
      };

      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.tweet.infiniteFeed.setInfiniteData({ onlyFollowing: true }, updateData);
      trpcUtils.tweet.infinitProfileFeed.setInfiniteData({ userId: user.id }, updateData);
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id });
  }

  return (
    <li className="flex gap-4 border-b p-4">
      <Link href={`/profiles/${user?.id}`}>
        <ProfileImage src={user?.image} />
      </Link>
      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          <Link
            href={`/profiles/${user?.id}`}
            className="font-bold outline-none hover:underline focus-visible:underline"
          >
            {user?.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span>{dateTimeFormatter.format(createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap">{content}</p>
        <HeartButton
          likedByMe={likedByMe}
          likeCount={likeCount}
          isLoading={toggleLike.isLoading}
          onClick={handleToggleLike}
        />
      </div>
    </li>
  );
}

type HeartButtonProps = {
  isLoading: boolean;
  likedByMe: boolean;
  likeCount: number;
  onClick: () => void;
};

function HeartButton({
  isLoading,
  likedByMe,
  likeCount,
  onClick,
}: HeartButtonProps) {
  const session = useSession();
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;
  if (session.status !== "authenticated") {
    return (
      <div className="self-sttart my-1 flex items-center gap-3 text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }
  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      <IconHoverEffect red>
        <HeartIcon
          className={`transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
          }`}
        />
      </IconHoverEffect>
      <span>{likeCount}</span>
    </button>
  );
}
