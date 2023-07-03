import {
  type InferGetServerSidePropsType,
  type GetStaticPaths,
  type GetStaticPropsContext,
  type NextPage,
} from "next";
import Head from "next/head";
import ErrorPage from "next/error";
import { ssgHelper } from "y/server/api/ssgHelper";
import { api } from "y/utils/api";
import Link from "next/link";
import { IconHoverEffect } from "y/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "../../components/ProfileImage";
import { InfiniteTweetList } from "y/components/InfiniteTweetList";
import { useSession } from "next-auth/react";
import { Button } from "y/components/Button";

const ProfilePage: NextPage<
  InferGetServerSidePropsType<typeof getStaticProps>
> = ({ id }) => {
  const { data: profile } = api.profile.getById.useQuery({ id });
  const tweets = api.tweet.infinitProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const trpcUtils = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcUtils.profile.getById.setData({ id }, (oldData) => {
        if (oldData == null) return;

        const countModifier = addedFollow ? 1 : -1;

        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: oldData.followersCount + countModifier,
        };
      });
    },
  });

  if (profile == null || profile.name == null)
    return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{`Twitter Clone ${profile.name}`}</title>
      </Head>
      <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
        <Link href=".." className="mr-2">
          <IconHoverEffect>
            <VscArrowLeft className="h-6 w-6" />
          </IconHoverEffect>
        </Link>
        <ProfileImage src={profile.image} className="flex-shrink-0" />
        <div className="ml-2 flex-grow">
          <h1 className="text-lg font-bold">{profile.name}</h1>
          <div className="text-gray-500">
            {profile.tweetsCount}&nbsp;
            {getPlural(profile.tweetsCount, "Tweet", "Tweets")} - &nbsp;
            {profile.followersCount}&nbsp;
            {getPlural(profile.followersCount, "Follower", "Followers")} -
            &nbsp;
            {profile.followsCount} Following
          </div>
        </div>
        <FollowButton
          userId={id}
          isLoading={toggleFollow.isLoading}
          isFollowing={profile.isFollowing}
          onClick={() => toggleFollow.mutate({ userId: id })}
        />
      </header>
      <main>
        <InfiniteTweetList
          tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
          isError={tweets.isError}
          isLoading={tweets.isLoading}
          hasMore={tweets.hasNextPage}
          fetchNewTweets={tweets.fetchNextPage}
        />
      </main>
    </>
  );
};

function FollowButton({
  userId,
  isLoading,
  isFollowing,
  onClick,
}: {
  userId: string;
  isLoading: boolean;
  isFollowing: boolean;
  onClick: () => void;
}) {
  const session = useSession();

  if (session.status !== "authenticated" || session.data.user.id === userId)
    return null;

  return (
    <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

const pluralRules = new Intl.PluralRules();
function getPlural(number: number, singular: string, plural: string) {
  return pluralRules.select(number) === "one" ? singular : plural;
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>
) {
  const id = context.params?.id;

  if (id == null) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const ssg = ssgHelper();
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      id,
      trpcState: ssg.dehydrate(),
    },
  };
}

export default ProfilePage;
