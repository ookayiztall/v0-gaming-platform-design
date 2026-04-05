'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader, Search } from 'lucide-react';
import { useYoutubeMusicPlayback } from '@/lib/youtube-music/playback-context';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Playlist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
    };
  };
  contentDetails: {
    itemCount: number;
  };
}

interface SearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { default: { url: string } };
  };
}

export default function YouTubeMusicModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'playlists' | 'search'>('playlists');
  const { setCurrentTrack } = useYoutubeMusicPlayback();

  const { data: playlistsData, isLoading: playlistsLoading } = useSWR(
    '/api/youtube-music/playlists',
    fetcher
  );

  const { data: searchData, isLoading: searchLoading } = useSWR(
    activeTab === 'search' && searchQuery
      ? `/api/youtube-music/search?q=${encodeURIComponent(searchQuery)}`
      : null,
    fetcher
  );

  const handlePlayTrack = (videoId: string, title: string, artist: string, thumbnail: string) => {
    setCurrentTrack(videoId, title, artist, thumbnail);
  };

  const playlists: Playlist[] = playlistsData?.playlists || [];
  const results: SearchResult[] = searchData?.results || [];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">YouTube Music</h1>
        <p className="text-sm text-muted-foreground">
          Search and play your favorite music
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'playlists'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Playlists
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'search'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Search
        </button>
      </div>

      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          {playlistsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No playlists found</p>
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search YouTube Music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>

          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <SearchResultCard
                  key={result.id.videoId}
                  result={result}
                  onPlay={handlePlayTrack}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
      <div className="aspect-square overflow-hidden">
        <img
          src={playlist.snippet.thumbnails.default.url}
          alt={playlist.snippet.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate text-foreground">
          {playlist.snippet.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {playlist.contentDetails.itemCount} songs
        </p>
      </div>
    </Card>
  );
}

function SearchResultCard({
  result,
  onPlay,
}: {
  result: SearchResult;
  onPlay: (videoId: string, title: string, artist: string, thumbnail: string) => void;
}) {
  return (
    <Card
      className="bg-card/50 border-border/50 p-3 flex gap-3 hover:bg-card/80 transition-colors cursor-pointer"
      onClick={() =>
        onPlay(
          result.id.videoId,
          result.snippet.title,
          result.snippet.channelTitle,
          result.snippet.thumbnails.default.url
        )
      }
    >
      <img
        src={result.snippet.thumbnails.default.url}
        alt={result.snippet.title}
        className="w-12 h-12 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate text-foreground">
          {result.snippet.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {result.snippet.channelTitle}
        </p>
      </div>
      <Button size="sm" variant="ghost" className="shrink-0">
        Play
      </Button>
    </Card>
  );
}
