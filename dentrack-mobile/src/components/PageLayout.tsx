import { ReactNode } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent } from '@ionic/react';
import { BottomTabs } from './BottomTabs';

interface PageLayoutProps {
  title?: string;
  children: ReactNode;
  toolbarEndSlot?: ReactNode;
  toolbarStartSlot?: ReactNode;
  hideTabs?: boolean;
}

export function PageLayout({
  title,
  children,
  toolbarEndSlot,
  toolbarStartSlot,
  hideTabs,
}: PageLayoutProps) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {toolbarStartSlot && <IonButtons slot="start">{toolbarStartSlot}</IonButtons>}
          {title && <IonTitle>{title}</IonTitle>}
          {toolbarEndSlot && <IonButtons slot="end">{toolbarEndSlot}</IonButtons>}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>{children}</IonContent>
      {!hideTabs && <BottomTabs />}
    </IonPage>
  );
}
