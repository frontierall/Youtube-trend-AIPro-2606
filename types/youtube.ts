export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    categoryId: string;
    tags?: string[];
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
    favoriteCount?: string;
  };
  contentDetails: {
    duration: string;
    definition: string;
    caption: string;
  };
}

export interface YouTubeCommentSnippet {
  textDisplay: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
}

export interface YouTubeCommentThread {
  id: string;
  snippet: {
    topLevelComment: {
      id: string;
      snippet: YouTubeCommentSnippet;
    };
    totalReplyCount: number;
    videoId: string;
  };
}

export interface YouTubeCategory {
  id: string;
  snippet: {
    title: string;
    assignable: boolean;
  };
}
