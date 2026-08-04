import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { Widget } from './Widget';
import { StorageService } from '../services/StorageService';

export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;
  const widgetAction = props.widgetAction;
  
  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED') {
    // Get latest song from history to display
    const history = await StorageService.getHistory();
    const lastReceived = history.find(item => item.direction === 'received');
    
    requestWidgetUpdate({
      widgetName: widgetInfo.widgetName,
      renderWidget: () => <Widget song={lastReceived} />,
      widgetNotFound: () => {
        // Widget not found
      }
    });
  }
}

export const updateWidget = async () => {
  const history = await StorageService.getHistory();
  const lastReceived = history.find(item => item.direction === 'received');
  
  requestWidgetUpdate({
    widgetName: 'LovelyWidget',
    renderWidget: () => <Widget song={lastReceived} />,
    widgetNotFound: () => {}
  });
};
