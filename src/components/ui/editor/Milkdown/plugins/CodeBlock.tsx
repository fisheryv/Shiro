import { useNodeViewContext } from '@prosemirror-adapter/react'
import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { useForceUpdate } from 'framer-motion'
import type { MilkdownPlugin } from '@milkdown/ctx'
import type { NodeViewContext } from '@prosemirror-adapter/react'
import type { ModalContentPropsInternal } from '~/components/ui/modal'
import type { FC } from 'react'
import type { PluginCtx } from './types'

import { schemaCtx } from '@milkdown/core'
import { codeBlockSchema } from '@milkdown/preset-commonmark'
import { $view } from '@milkdown/utils'

import { BlockLoading } from '~/components/modules/shared/BlockLoading'
import { StyledButton } from '~/components/ui/button'
import { CodeEditor } from '~/components/ui/code-editor'
import { Input } from '~/components/ui/input'
import { useCurrentModal, useModalStack } from '~/components/ui/modal'

import { useEditorCtx } from '../ctx'

const CodeBlock = () => {
  const { node } = useNodeViewContext()

  const language = node.attrs.language
  const content = node.content.firstChild?.text

  switch (language) {
    case 'excalidraw': {
      return (
        <div contentEditable={false}>
          <ExcalidrawBoard content={content || '{}'} />
        </div>
      )
    }
  }

  return (
    <div className="my-4" contentEditable={false}>
      <NormalCodeBlock content={content || ''} language={language} />
    </div>
  )
}

const NormalCodeBlock: FC<{
  content: string
  language: string
}> = ({ content, language }) => {
  const nodeCtx = useNodeViewContext()
  const ctx = useEditorCtx()

  return (
    <div className="group relative">
      <CodeEditor
        ref={(el) => {
          if (!content && el)
            requestAnimationFrame(() => requestAnimationFrame(() => el.focus()))
        }}
        content={content}
        minHeight="20px"
        className="rounded-md border bg-gray-100 p-2 dark:bg-zinc-900"
        language={language}
        onChange={(code) => {
          const view = nodeCtx.view

          const node = nodeCtx.node

          const pos = nodeCtx.getPos()
          const tr = view.state.tr
          if (!pos) return
          if (!code) {
            // remove node

            view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize))
            return
          }

          const nextNode = ctx!.get(schemaCtx).text(code)

          tr.replaceWith(pos + 1, pos + node.nodeSize, nextNode)
          view.dispatch(tr)
        }}
      />
      <div className="absolute bottom-1 right-1 opacity-0 duration-200 group-hover:opacity-100">
        <Input
          defaultValue={language}
          onBlur={(e) => {
            const v = e.target.value
            nodeCtx.setAttrs({
              language: v,
            })
          }}
        />
      </div>
    </div>
  )
}
export const CodeBlockPlugin: (pluginCtx: PluginCtx) => MilkdownPlugin[] = ({
  nodeViewFactory,
}) => [
  $view(codeBlockSchema.node, () =>
    nodeViewFactory({
      component: CodeBlock,
    }),
  ),
]

export const ExcalidrawBoard: FC<{ content: string }> = ({ content }) => {
  const modalStack = useModalStack()
  const nodeCtx = useNodeViewContext()

  const [forceUpdate, key] = useForceUpdate()
  useEffect(() => {
    forceUpdate()
  }, [content])

  const Excalidraw = useMemo(
    () =>
      lazy(() =>
        import('~/components/ui/excalidraw/Excalidraw').then((m) => ({
          default: m.Excalidraw,
        })),
      ),
    [],
  )

  const handleEdit = () => {
    const Content: FC<ModalContentPropsInternal> = () => {
      const valueRef = useRef<string | undefined>(content)
      const valueGetterRef = useRef(() => valueRef.current)
      return (
        <div className="flex h-full w-full flex-col">
          <Suspense>
            <Excalidraw
              className="h-full w-full flex-grow"
              data={JSON.parse(content)}
              viewModeEnabled={false}
              zenModeEnabled={false}
              onChange={async (elements, appState, files) => {
                const serializeAsJSON = await import(
                  '@excalidraw/excalidraw'
                ).then((m) => m.serializeAsJSON)
                valueRef.current = JSON.stringify(
                  JSON.parse(
                    serializeAsJSON(elements, appState, files, 'database'),
                  ),
                  null,
                  0,
                )
              }}
            />

            <SharedModalAction
              getValue={valueGetterRef.current}
              nodeCtx={nodeCtx}
            />
          </Suspense>
        </div>
      )
    }
    modalStack.present({
      title: 'Excalidraw',
      max: true,
      content: Content,
    })
  }
  return (
    <div onClick={handleEdit} className="cursor-pointer">
      <Suspense fallback={<BlockLoading />}>
        <Excalidraw
          className="pointer-events-none"
          showExtendButton={false}
          key={key}
          data={useMemo(() => JSON.parse(content || '{}'), [content])}
        />
      </Suspense>
    </div>
  )
}

const SharedModalAction: FC<{
  nodeCtx: NodeViewContext
  getValue(): string | undefined
}> = ({ nodeCtx, getValue }) => {
  const { getPos, view, node } = nodeCtx
  const { dismiss } = useCurrentModal()
  const ctx = useEditorCtx()

  const deleteNode = () => {
    const pos = getPos()
    if (!pos) return
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize))
    dismiss()
  }
  return (
    <div className="mt-4 flex justify-end space-x-2 p-2">
      <StyledButton variant="secondary" onClick={deleteNode}>
        删除
      </StyledButton>
      <StyledButton
        onClick={() => {
          // set first firstChild text
          const pos = getPos()
          if (!pos) return
          const tr = view.state.tr

          const nextValue = getValue()!

          const nextNode = ctx!.get(schemaCtx).text(nextValue)

          tr.replaceWith(pos + 1, pos + node.nodeSize, nextNode)
          view.dispatch(tr)

          dismiss()
        }}
      >
        保存
      </StyledButton>
    </div>
  )
}
