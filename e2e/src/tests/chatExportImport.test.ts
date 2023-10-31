import { FileUtil } from '@/e2e/src/utils/fileUtil';

import { Conversation } from '@/src/types/chat';
import { FolderInterface } from '@/src/types/folder';
import { OpenAIEntityModelID, OpenAIEntityModels } from '@/src/types/openai';

import test from '@/e2e/src/core/fixtures';
import {
  ExpectedConstants,
  ExpectedMessages,
  FolderConversation,
  Import,
  MenuOptions,
} from '@/e2e/src/testData';
import { ImportConversation } from '@/e2e/src/testData/conversationHistory/importConversation';
import { expect } from '@playwright/test';

let folderConversationFilename: string;
let rootConversationFilename: string;
let newFolderConversationFilename: string;
let threeConversationsFilename: string;

test(
  'Export and import one chat in a folder.\n' +
    `Export and import one chat in a folder when folder doesn't exist`,
  async ({
    dialHomePage,
    folderConversations,
    setTestIds,
    conversationData,
    localStorageManager,
    conversations,
    chatBar,
    folderDropdownMenu,
    conversationDropdownMenu,
  }) => {
    setTestIds('EPMRTC-908', 'EPMRTC-909');
    let conversationInFolder: FolderConversation;
    let filePath: string;
    await test.step('Prepare exported conversation inside folder and another conversation outside folders', async () => {
      conversationInFolder =
        conversationData.prepareDefaultConversationInFolder();
      conversationData.resetData();
      const conversationOutsideFolder =
        conversationData.prepareDefaultConversation();

      await localStorageManager.setFolders(conversationInFolder.folders);
      await localStorageManager.setConversationHistory(
        conversationInFolder.conversations[0],
        conversationOutsideFolder,
      );
      await localStorageManager.setSelectedConversation(
        conversationInFolder.conversations[0],
      );
    });

    await test.step('Export conversation inside folder using chat bar conversation menu', async () => {
      await dialHomePage.openHomePage();
      await dialHomePage.waitForPageLoaded();
      await folderConversations.expandCollapseFolder(
        conversationInFolder.folders.name,
      );
      await folderConversations.openFolderConversationDropdownMenu(
        conversationInFolder.folders.name,
        conversationInFolder.conversations[0].name,
      );
      filePath = await conversations.exportConversation();
    });

    await test.step('Delete conversation inside folder, re-import it again and verify it displayed inside folder', async () => {
      await folderConversations.openFolderConversationDropdownMenu(
        conversationInFolder.folders.name,
        conversationInFolder.conversations[0].name,
      );
      await conversationDropdownMenu.selectMenuOption(MenuOptions.delete);
      await conversations
        .getConversationInput(conversationInFolder.conversations[0].name)
        .clickTickButton();
      await chatBar.importConversation(filePath);

      expect
        .soft(
          await folderConversations.isFolderConversationVisible(
            conversationInFolder.folders.name,
            conversationInFolder.conversations[0].name,
          ),
          ExpectedMessages.conversationIsVisible,
        )
        .toBeTruthy();
    });

    await test.step('Delete folder with the conversation inside, re-import it again and verify it displayed inside folder', async () => {
      await folderConversations.openFolderConversationDropdownMenu(
        conversationInFolder.folders.name,
        conversationInFolder.conversations[0].name,
      );
      await conversationDropdownMenu.selectMenuOption(MenuOptions.delete);
      await conversations
        .getConversationInput(conversationInFolder.conversations[0].name)
        .clickTickButton();
      await folderConversations.openFolderDropdownMenu(
        conversationInFolder.folders.name,
      );
      await folderDropdownMenu.selectMenuOption(MenuOptions.delete);
      await folderConversations
        .getFolderInput(conversationInFolder.folders.name)
        .clickTickButton();

      await chatBar.importConversation(filePath);

      await folderConversations.expandCollapseFolder(
        conversationInFolder.folders.name,
      );
      expect
        .soft(
          await folderConversations.isFolderConversationVisible(
            conversationInFolder.folders.name,
            conversationInFolder.conversations[0].name,
          ),
          ExpectedMessages.conversationIsVisible,
        )
        .toBeTruthy();
    });
  },
);

test('Export and import chat structure with all conversations', async ({
  dialHomePage,
  folderConversations,
  setTestIds,
  conversationData,
  localStorageManager,
  conversations,
  chatBar,
  confirmationDialog,
}) => {
  setTestIds('EPMRTC-907');
  let conversationsInFolder: FolderConversation;
  let emptyFolder: FolderInterface;
  let conversationOutsideFolder: Conversation;
  let filePath: string;
  await test.step('Prepare empty folder, exported conversations inside folder and another conversation outside folder', async () => {
    emptyFolder = conversationData.prepareFolder();
    conversationData.resetData();

    conversationsInFolder = conversationData.prepareFolderWithConversations(2);
    conversationData.resetData();

    conversationOutsideFolder = conversationData.prepareDefaultConversation();

    await localStorageManager.setFolders(
      emptyFolder,
      conversationsInFolder.folders,
    );
    await localStorageManager.setConversationHistory(
      ...conversationsInFolder.conversations,
      conversationOutsideFolder,
    );
    await localStorageManager.setSelectedConversation(
      conversationOutsideFolder,
    );
  });

  await test.step('Export all conversations using chat bar Export button', async () => {
    await dialHomePage.openHomePage();
    await dialHomePage.waitForPageLoaded();
    filePath = await chatBar.exportConversation();
  });

  await test.step('Delete all conversations and folders, re-import again and verify they are displayed', async () => {
    await chatBar.deleteAllConversations();
    await confirmationDialog.confirm();
    await chatBar.importConversation(filePath);

    await folderConversations.expandCollapseFolder(
      conversationsInFolder.folders.name,
    );

    for (const conversation of conversationsInFolder.conversations) {
      expect
        .soft(
          await folderConversations.isFolderConversationVisible(
            conversationsInFolder.folders.name,
            conversation.name,
          ),
          ExpectedMessages.conversationIsVisible,
        )
        .toBeTruthy();
    }
    expect
      .soft(
        await folderConversations.getFolderByName(emptyFolder.name).isVisible(),
        ExpectedMessages.folderIsVisible,
      )
      .toBeTruthy();
    expect
      .soft(
        await conversations
          .getConversationByName(conversationOutsideFolder.name)
          .isVisible(),
        ExpectedMessages.conversationIsVisible,
      )
      .toBeTruthy();
  });
});

test('Existed chats stay after import', async ({
  dialHomePage,
  folderConversations,
  setTestIds,
  conversationData,
  localStorageManager,
  conversations,
  chatBar,
  chatHeader,
}) => {
  setTestIds('EPMRTC-913');
  let conversationsInFolder: FolderConversation;
  let conversationOutsideFolder: Conversation;
  let importedFolderConversation: Conversation;
  let importedRootConversation: Conversation;
  let importedNewFolderConversation: FolderConversation;

  await test.step('Prepare conversations inside folder and another conversation outside folder', async () => {
    conversationsInFolder = conversationData.prepareFolderWithConversations(2);
    conversationData.resetData();

    conversationOutsideFolder = conversationData.prepareDefaultConversation();
    conversationData.resetData();

    await localStorageManager.setFolders(conversationsInFolder.folders);
    await localStorageManager.setConversationHistory(
      ...conversationsInFolder.conversations,
      conversationOutsideFolder,
    );
  });

  await test.step('Prepare conversation inside existing folder to import, conversation inside new folder to import and conversation inside root', async () => {
    importedFolderConversation = conversationData.prepareDefaultConversation();
    folderConversationFilename = ImportConversation.prepareConversationFile(
      importedFolderConversation,
      conversationsInFolder,
    );
    conversationData.resetData();

    importedRootConversation = conversationData.prepareDefaultConversation();
    rootConversationFilename = ImportConversation.prepareConversationFile(
      importedRootConversation,
    );
    conversationData.resetData();

    importedNewFolderConversation =
      conversationData.prepareDefaultConversationInFolder();
    newFolderConversationFilename = ImportConversation.prepareConversationFile(
      importedNewFolderConversation.conversations[0],
      importedNewFolderConversation,
    );
  });

  await test.step('Import conversation inside existing folder and verify it is exported and existing conversations remain inside folder', async () => {
    await dialHomePage.openHomePage();
    await dialHomePage.waitForPageLoaded(true);
    await chatBar.importConversation(folderConversationFilename, false);
    await folderConversations.expandCollapseFolder(
      conversationsInFolder.folders.name,
    );
    expect
      .soft(
        await chatHeader.chatTitle.getElementInnerContent(),
        ExpectedMessages.headerTitleCorrespondRequest,
      )
      .toBe(importedFolderConversation.name);
    expect
      .soft(
        await folderConversations.isFolderConversationVisible(
          conversationsInFolder.folders.name,
          conversationsInFolder.conversations[0].name,
        ),
        ExpectedMessages.conversationIsVisible,
      )
      .toBeTruthy();
    expect
      .soft(
        await folderConversations.isFolderConversationVisible(
          conversationsInFolder.folders.name,
          conversationsInFolder.conversations[1].name,
        ),
        ExpectedMessages.conversationIsVisible,
      )
      .toBeTruthy();
  });

  await test.step('Import root conversation and verify it is exported and existing root conversations remain', async () => {
    await chatBar.importConversation(rootConversationFilename, false);
    await conversations
      .getConversationByName(importedRootConversation.name)
      .waitFor();
    expect
      .soft(
        await conversations
          .getConversationByName(conversationOutsideFolder.name)
          .isVisible(),
        ExpectedMessages.conversationIsVisible,
      )
      .toBeTruthy();
  });

  await test.step('Import conversation inside new folder and verify it is exported', async () => {
    await chatBar.importConversation(newFolderConversationFilename, false);
    await folderConversations
      .getFolderByName(importedNewFolderConversation.folders.name)
      .waitFor();
    expect
      .soft(
        await chatHeader.chatTitle.getElementInnerContent(),
        ExpectedMessages.headerTitleCorrespondRequest,
      )
      .toBe(importedNewFolderConversation.conversations[0].name);
  });
});

test(
  'Continue working with imported file. Regenerate reposponse.\n' +
    'Continue working with imported file. Send a message.\n' +
    'Continue working with imported file. Edit a message',
  async ({
    dialHomePage,
    setTestIds,
    conversationData,
    chatMessages,
    chat,
    chatBar,
  }) => {
    setTestIds('EPMRTC-923', 'EPMRTC-924', 'EPMRTC-925');
    let importedRootConversation: Conversation;
    const requests = ['first request', 'second request', 'third request'];

    await test.step('Prepare conversation with several messages to import', async () => {
      importedRootConversation =
        conversationData.prepareModelConversationBasedOnRequests(
          OpenAIEntityModels[OpenAIEntityModelID.MIRROR],
          requests,
        );
      threeConversationsFilename = ImportConversation.prepareConversationFile(
        importedRootConversation,
      );
    });

    await test.step('Import conversation, regenerate the response and verify last response is regenerated', async () => {
      await dialHomePage.openHomePage();
      await dialHomePage.waitForPageLoaded(true);
      await chatBar.importConversation(threeConversationsFilename, false);
      await chat.regenerateResponse();
      const lastResponseContent = await chatMessages.getLastMessageContent();
      expect
        .soft(lastResponseContent, ExpectedMessages.messageContentIsValid)
        .toBe(requests[2]);
    });

    await test.step('Send new request in chat and verify response is received', async () => {
      const newRequest = 'new request';
      await chat.sendRequestWithButton(newRequest);
      const lastResponseContent = await chatMessages.getLastMessageContent();
      expect
        .soft(lastResponseContent, ExpectedMessages.messageContentIsValid)
        .toBe(newRequest);
    });

    await test.step('Edit 1st request in chat and verify 1st response is regenerated', async () => {
      const updatedMessage = 'edited message';
      await chatMessages.openEditMessageMode(requests[0]);
      await chatMessages.editMessage(updatedMessage);
      const messagesCount = await chatMessages.chatMessages.getElementsCount();
      expect
        .soft(messagesCount, ExpectedMessages.messageCountIsCorrect)
        .toBe(2);
      const lastResponseContent = await chatMessages.getLastMessageContent();
      expect
        .soft(lastResponseContent, ExpectedMessages.messageContentIsValid)
        .toBe(updatedMessage);
    });
  },
);

test('Import file from 1.4 DIAL milestone to conversations and continue working with it', async ({
  dialHomePage,
  chatBar,
  setTestIds,
  folderConversations,
  prompts,
  chatMessages,
  conversations,
  apiHelper,
  chat,
}) => {
  setTestIds('EPMRTC-906');
  await test.step('Import conversation from 1.4 app version and verify folder with Gpt-3.5 chat and its history is visible', async () => {
    await dialHomePage.openHomePage();
    await dialHomePage.waitForPageLoaded(true);
    await chatBar.importConversation(Import.v14AppImportedFilename, false);

    await folderConversations.expandCollapseFolder(Import.v14AppFolderName);
    expect
      .soft(
        await folderConversations.isFolderConversationVisible(
          Import.v14AppFolderName,
          Import.v14AppFolderChatName,
        ),
        ExpectedMessages.conversationIsVisible,
      )
      .toBeTruthy();

    await folderConversations.selectFolderConversation(
      Import.v14AppFolderName,
      Import.v14AppFolderChatName,
    );
    const folderChatMessagesCount =
      await chatMessages.chatMessages.getElementsCount();
    expect
      .soft(folderChatMessagesCount, ExpectedMessages.messageCountIsCorrect)
      .toBe(2);
  });

  await test.step('Verify New conversation with Gpt-4 icon is imported', async () => {
    await conversations
      .getConversationByName(ExpectedConstants.newConversationTitle, 2)
      .waitFor();

    const gpt4Model = await apiHelper.getModel(
      OpenAIEntityModels[OpenAIEntityModelID.GPT_4].name,
    );
    const newGpt4ConversationIcon =
      await conversations.getConversationIconAttributes(
        ExpectedConstants.newConversationTitle,
        2,
      );
    expect
      .soft(
        newGpt4ConversationIcon.iconEntity,
        ExpectedMessages.chatBarIconEntityIsValid,
      )
      .toBe(gpt4Model!.id);
    expect
      .soft(
        newGpt4ConversationIcon.iconUrl,
        ExpectedMessages.chatBarIconSourceIsValid,
      )
      .toBe(gpt4Model!.iconUrl);
  });

  await test.step('Verify Bison conversation with default icon is imported', async () => {
    await conversations
      .getConversationByName(Import.v14AppBisonChatName)
      .waitFor();

    const isBisonConversationHasDefaultIcon =
      await conversations.isConversationHasDefaultIcon(
        Import.v14AppBisonChatName,
      );
    expect
      .soft(
        isBisonConversationHasDefaultIcon,
        ExpectedMessages.chatBarConversationIconIsDefault,
      )
      .toBeTruthy();
  });

  await test.step('Verify no prompts are imported', async () => {
    const promptsCount = await prompts.getPromptsCount();
    expect.soft(promptsCount, ExpectedMessages.noPromptsImported).toBe(0);
  });

  await test.step('Send new request in Gpr-3.5 and verify response is received', async () => {
    const newRequest = '1+2=';
    await chat.sendRequestWithButton(newRequest);
    const lastResponseContent = await chatMessages.getLastMessageContent();
    expect
      .soft(lastResponseContent !== '', ExpectedMessages.messageContentIsValid)
      .toBeTruthy();
  });
});

test.afterAll(async () => {
  FileUtil.removeExportFolder();
  const importFilesToDelete: string[] = [
    folderConversationFilename,
    rootConversationFilename,
    newFolderConversationFilename,
    threeConversationsFilename,
  ];
  importFilesToDelete.forEach((f) => FileUtil.deleteImportFile(f));
});