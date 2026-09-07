import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function Widget({ song, colors }) {
  // Fallback to lovely theme if colors not passed
  const bgColor = colors?.background || '#FFF5F7';
  const primaryColor = colors?.primary || '#FF6B8B';
  const textColor = colors?.textPrimary || '#2D3748';
  const textSecondaryColor = colors?.textSecondary || '#718096';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bgColor,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget
        text="Lovely Toon"
        style={{
          fontSize: 14,
          fontFamily: 'sans-serif-medium',
          color: primaryColor,
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
              color: textColor,
              textAlign: 'center',
            }}
            maxLines={2}
          />
          <TextWidget
            text={song.artist}
            style={{
              fontSize: 14,
              fontFamily: 'sans-serif-medium',
              color: textSecondaryColor,
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
              color: textSecondaryColor,
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
