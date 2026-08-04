import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function Widget({ song }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5F7',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget
        text="🎵 Lovely Toon"
        style={{
          fontSize: 14,
          fontFamily: 'sans-serif-medium',
          color: '#FF6B8B',
          marginBottom: 8,
        }}
      />
      
      {song && song.title ? (
        <FlexWidget
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text={song.title}
            style={{
              fontSize: 18,
              fontFamily: 'sans-serif-medium',
              color: '#2D3748',
              textAlign: 'center',
            }}
            maxLines={2}
          />
          <TextWidget
            text={song.artist}
            style={{
              fontSize: 14,
              fontFamily: 'sans-serif-medium',
              color: '#718096',
              textAlign: 'center',
              marginTop: 4,
            }}
            maxLines={1}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget
            text="Waiting for music..."
            style={{
              fontSize: 16,
              fontFamily: 'sans-serif',
              color: '#A0AEC0',
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
