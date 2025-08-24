
import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { Message, Role } from '../types';
import { UserIcon, SparklesIcon } from './icons';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;
  const contentRef = useRef<HTMLDivElement>(null);

  const rawContent = message.content.endsWith('▋')
    ? message.content.slice(0, -1)
    : message.content;

  const sanitizedHtml = isModel
    ? DOMPurify.sanitize(marked.parse(rawContent, { async: false, gfm: true, breaks: true }) as string)
    : '';

  useEffect(() => {
    if (isModel && contentRef.current) {
        contentRef.current.querySelectorAll('pre code').forEach((block) => {
            const pre = block.parentElement;
            if (pre && !pre.querySelector('.copy-button')) {
                const button = document.createElement('button');
                button.innerText = 'Copy';
                button.className = 'copy-button';
                pre.appendChild(button);
                button.addEventListener('click', () => {
                    const codeText = (block as HTMLElement).innerText;
                    navigator.clipboard.writeText(codeText).then(() => {
                        button.innerText = 'Copied!';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy code: ', err);
                        button.innerText = 'Error';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    });
                });
            }
            // Always re-highlight to handle streaming content
            hljs.highlightElement(block as HTMLElement);
        });
    }
  }, [sanitizedHtml, isModel]);

  return (
    <div
      className={`flex items-start gap-4 p-4 my-2 rounded-lg ${
        isModel ? 'bg-gray-100 dark:bg-gray-700/50' : ''
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isModel ? 'bg-indigo-500' : 'bg-gray-500 dark:bg-gray-600'
        }`}
      >
        {isModel ? (
          <SparklesIcon className="w-5 h-5 text-white" />
        ) : (
          <UserIcon className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex flex-col pt-1 w-full overflow-hidden">
        <p className="font-bold text-gray-800 dark:text-gray-200">{isModel ? 'Tallman' : 'You'}</p>
        {isModel ? (
          <div
            ref={contentRef}
            className="text-gray-700 dark:text-gray-300 prose prose-p:my-2 prose-li:my-0 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml + (message.content.endsWith('▋') ? '<span class="blinking-cursor">▋</span>' : '') }}
          />
        ) : (
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComponent;