import { PARAGRAPH } from 'elements/paragraph';
import { Editor, Point, Range, Transforms } from 'slate';
import { ACTION_ITEM } from './types';

/**
 * Pressing enter on an empty block (except paragraph)
 * replaces it with a new paragraph and unwrap action item.
 */
export const withBreakReset = ({ types }: { types: string[] }) => <
  T extends Editor
>(
  editor: T
) => {
  const { insertBreak } = editor;

  editor.insertBreak = () => {
    const match = Editor.above(editor, {
      match: n => Editor.isBlock(editor, n),
    });

    if (match) {
      const [matchingNode] = match;
      if (matchingNode.type !== PARAGRAPH) {
        if (
          matchingNode.children[matchingNode.children.length - 1].text
            .length === 0
        ) {
          // should use setNodes once it reset the state of the node
          Transforms.delete(editor);
          const paragraph = {
            type: PARAGRAPH,
            children: [{ text: '' }],
          };
          return Transforms.insertNodes(editor, paragraph);
        }

        // if (types.includes(matchingNode.type)) {
        //   return Transforms.insertNodes(editor, {
        //     type: matchingNode.type,
        //     children: [{ text: '' }],
        //   });
        // }
      }
    }

    insertBreak();
  };

  return editor;
};

export const withActionItem = <T extends Editor>(editor: T) => {
  const { deleteBackward } = editor;

  /**
   * If at the start of an action item (not selected),
   * set to paragraph
   */
  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => n.type === ACTION_ITEM,
      });

      if (match) {
        const [, path] = match;
        const start = Editor.start(editor, path);
        if (Point.equals(selection.anchor, start)) {
          Transforms.setNodes(editor, { type: PARAGRAPH });
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
};