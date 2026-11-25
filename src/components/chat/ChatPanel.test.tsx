import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ChatPanel from './ChatPanel';
import { SETUP_NOTICE } from './useNanoChat';
import type { UsableAvailability } from './languageModel';
import {
  installFakeLanguageModel,
  uninstallFakeLanguageModel,
  type FakeLanguageModelOptions,
} from '../../test/fakeLanguageModel';

const STARTERS = ['What does Michael do?', 'What has he built?', 'How can I reach him?'];
const DOWNLOAD_NOTE = "Chrome's built-in AI downloads once, the first time you ask.";
const DISCLAIMER = "Runs in your browser with Chrome's built-in AI. Your questions aren't sent to this site. Answers may be wrong.";

function setup(opts: FakeLanguageModelOptions = {}, availability: UsableAvailability = 'available') {
  const fake = installFakeLanguageModel(opts);
  render(<ChatPanel availability={availability} />);
  return { fake, input: screen.getByRole('textbox', { name: 'Your question' }) };
}

describe('ChatPanel', () => {
  afterEach(uninstallFakeLanguageModel);

  it('shows the heading and starter questions', () => {
    setup();
    expect(screen.getByRole('heading', { name: /Ask about Michael/ })).toBeInTheDocument();
    for (const q of STARTERS) expect(screen.getByRole('button', { name: q })).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it('focusing the input starts preparing, but rendering alone does not', async () => {
    const { fake, input } = setup();
    expect(fake.create).not.toHaveBeenCalled();
    fireEvent.focus(input);
    await waitFor(() => expect(fake.create).toHaveBeenCalledTimes(1));
  });

  it('shows the download note only when a download is needed', () => {
    setup({}, 'downloadable');
    expect(screen.getByText(DOWNLOAD_NOTE)).toBeInTheDocument();
  });

  it('hides the download note when Nano is already available', () => {
    setup({}, 'available');
    expect(screen.queryByText(DOWNLOAD_NOTE)).not.toBeInTheDocument();
  });

  it('shows download progress while Chrome downloads', async () => {
    const { fake, input } = setup({ holdCreate: true, downloadProgress: [0.4] }, 'downloadable');
    fireEvent.focus(input);
    const bar = await screen.findByRole('progressbar', { name: "Downloading Chrome's AI" });
    expect(bar).toHaveAttribute('value', '0.4');
    await act(async () => fake.resolveCreate());
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  it('clicking a starter question asks it and shows the streamed answer', async () => {
    setup({ replies: [['Michael guides AI at Meta.']] });
    fireEvent.click(screen.getByRole('button', { name: 'What does Michael do?' }));
    const log = screen.getByRole('log');
    await waitFor(() => expect(within(log).getByText('Michael guides AI at Meta.')).toBeInTheDocument());
    expect(within(log).getByText('What does Michael do?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'What has he built?' })).not.toBeInTheDocument();
  });

  it('typing and submitting sends the question and clears the input', async () => {
    const { input } = setup({ replies: [['Hi!']] });
    fireEvent.change(input, { target: { value: 'Hello?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(within(screen.getByRole('log')).getByText('Hello?')).toBeInTheDocument();
    expect(input).toHaveValue('');
    await waitFor(() => expect(within(screen.getByRole('log')).getByText('Hi!')).toBeInTheDocument());
  });

  it('does not show trailing blank lines from the model', async () => {
    setup({ replies: [['Reach him on LinkedIn.', '\n\n  \n']] });
    fireEvent.click(screen.getByRole('button', { name: 'How can I reach him?' }));
    const log = screen.getByRole('log');
    await waitFor(() => expect(within(log).getByText('Reach him on LinkedIn.')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    expect(log.querySelector('.chat-msg--assistant')?.textContent).toBe('Reach him on LinkedIn.');
  });

  it('renders Markdown links in answers but not in the visitor\'s own text', async () => {
    setup({ replies: [['Try [LinkedIn](https://www.linkedin.com/in/x/).']] });
    const { input } = { input: screen.getByRole('textbox', { name: 'Your question' }) };
    fireEvent.change(input, { target: { value: '[me](https://example.com)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const log = screen.getByRole('log');
    await waitFor(() => expect(within(log).getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument());
    expect(within(log).getAllByRole('link')).toHaveLength(1);
    expect(within(log).getByText('[me](https://example.com)')).toBeInTheDocument();
  });

  it('caps input at 500 characters', () => {
    const { input } = setup();
    expect(input).toHaveAttribute('maxLength', '500');
  });

  it('shows Stop while replying and disables Send', async () => {
    const { fake } = setup({ holdStream: true, replies: [['Part', 'Rest']] });
    fireEvent.click(screen.getByRole('button', { name: 'What does Michael do?' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await act(async () => fake.releaseStream());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('Clear empties the log and brings starter questions back', async () => {
    setup({ replies: [['Answer']] });
    fireEvent.click(screen.getByRole('button', { name: 'What does Michael do?' }));
    await waitFor(() => expect(screen.getByText('Answer')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(within(screen.getByRole('log')).queryByText('Answer')).not.toBeInTheDocument();
    for (const q of STARTERS) expect(screen.getByRole('button', { name: q })).toBeInTheDocument();
  });

  it('shows the setup notice', async () => {
    const { input } = setup({ createError: new Error('no disk') }, 'downloadable');
    fireEvent.focus(input);
    expect(await screen.findByRole('status')).toHaveTextContent(SETUP_NOTICE);
  });
});
