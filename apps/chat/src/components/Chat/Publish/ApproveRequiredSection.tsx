import { IconClipboard } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'next-i18next';

import classNames from 'classnames';

import { EnumMapper } from '@/src/utils/app/mappers';
import { getPublicationId } from '@/src/utils/app/publications';

import { FeatureType } from '@/src/types/common';
import { FolderSectionProps } from '@/src/types/folder';
import { Publication, PublicationInfo } from '@/src/types/publication';
import { Translation } from '@/src/types/translation';

import {
  ConversationsActions,
  ConversationsSelectors,
} from '@/src/store/conversations/conversations.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  PublicationActions,
  PublicationSelectors,
} from '@/src/store/publication/publication.reducers';

import CaretIconComponent from '../../Common/CaretIconComponent';
import CollapsibleSection from '../../Common/CollapsibleSection';
import {
  ConversationPublicationResources,
  PromptPublicationResources,
} from './PublicationResources';

import some from 'lodash-es/some';

interface PublicationProps {
  publication: PublicationInfo & Partial<Publication>;
  featureType: FeatureType;
}

const PublicationItem = ({ publication, featureType }: PublicationProps) => {
  const dispatch = useAppDispatch();

  const selectedPublication = useAppSelector(
    PublicationSelectors.selectSelectedPublication,
  );
  const selectedConversationIds = useAppSelector(
    ConversationsSelectors.selectSelectedConversationsIds,
  );

  const [isOpen, setIsOpen] = useState(false);

  const selectedItemIsPublication = useMemo(
    () =>
      some(publication.resources, (r) =>
        some(selectedConversationIds, (id) => id.startsWith(r.reviewUrl)),
      ),
    [publication.resources, selectedConversationIds],
  );

  const handlePublicationSelect = useCallback(() => {
    setIsOpen(true);
    if (!isOpen) {
      dispatch(PublicationActions.uploadPublication({ url: publication.url }));
    } else {
      dispatch(
        PublicationActions.selectPublication({
          publication: publication as Publication,
        }),
      );
    }

    dispatch(
      ConversationsActions.selectConversations({
        conversationIds: [],
      }),
    );
  }, [dispatch, isOpen, publication]);

  const ResourcesComponent =
    featureType === FeatureType.Chat
      ? ConversationPublicationResources
      : PromptPublicationResources;

  return (
    <div className="flex flex-col gap-1">
      <div
        onClick={handlePublicationSelect}
        className={classNames(
          'group relative flex h-[30px] items-center rounded border-l-2 hover:bg-accent-primary-alpha',
          selectedPublication?.url === publication.url &&
            !selectedConversationIds.length
            ? 'border-l-accent-primary bg-accent-primary-alpha'
            : 'border-l-transparent',
        )}
      >
        <div className="group/button flex size-full cursor-pointer items-center gap-1 py-2 pr-3">
          <CaretIconComponent isOpen={isOpen} />
          <IconClipboard className="text-secondary" width={18} height={18} />
          <div
            className={classNames(
              'relative max-h-5 flex-1 truncate break-all text-left',
              selectedItemIsPublication && 'text-accent-primary',
            )}
            data-qa="folder-name"
          >
            {getPublicationId(publication.url)}
          </div>
        </div>
      </div>
      {isOpen && publication.resources && (
        <ResourcesComponent resources={publication.resources} />
      )}
    </div>
  );
};

export const ApproveRequiredSection = ({
  name,
  featureType,
  displayRootFiles,
  openByDefault = false,
  dataQa,
}: Omit<FolderSectionProps, 'filters'> & {
  featureType: FeatureType;
}) => {
  const { t } = useTranslation(Translation.SideBar);

  const selectedPublication = useAppSelector(
    PublicationSelectors.selectSelectedPublication,
  );
  const selectedConversationsIds = useAppSelector(
    ConversationsSelectors.selectSelectedConversationsIds,
  );
  const selectedConversations = useAppSelector(
    ConversationsSelectors.selectSelectedConversations,
  );
  const publicationItems = useAppSelector((state) =>
    PublicationSelectors.selectFilteredPublications(state, featureType),
  );

  const [isSectionHighlighted, setIsSectionHighlighted] = useState(false);

  useEffect(() => {
    const publicationReviewIds = publicationItems.flatMap((p) =>
      p.resources?.map((r) => r.reviewUrl),
    );
    const shouldBeHighlighted = !!(
      (selectedPublication &&
        !selectedConversationsIds.length &&
        selectedPublication.resourceTypes.includes(
          EnumMapper.getBackendResourceTypeByFeatureType(featureType),
        )) ||
      selectedConversationsIds.some((id) => publicationReviewIds.includes(id))
    );

    if (isSectionHighlighted !== shouldBeHighlighted) {
      setIsSectionHighlighted(shouldBeHighlighted);
    }
  }, [
    displayRootFiles,
    isSectionHighlighted,
    publicationItems,
    featureType,
    selectedConversations,
    selectedConversationsIds,
    selectedPublication,
  ]);

  return (
    <CollapsibleSection
      name={t(name)}
      openByDefault={openByDefault}
      dataQa={dataQa}
      isHighlighted={isSectionHighlighted}
    >
      {publicationItems.map((p) => (
        <PublicationItem
          featureType={featureType}
          key={p.url}
          publication={p}
        />
      ))}
    </CollapsibleSection>
  );
};
