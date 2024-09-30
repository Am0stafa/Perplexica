import { cn } from '@/lib/utils';
import { Dialog, Transition } from '@headlessui/react';
import { CloudUpload, RefreshCcw, RefreshCw } from 'lucide-react';
import React, {
  Fragment,
  useEffect,
  useState,
  type SelectHTMLAttributes,
} from 'react';
import ThemeSwitcher from './theme/Switcher';
import { Switch } from '@headlessui/react';
import { useCookies } from 'react-cookie';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = ({ className, ...restProps }: InputProps) => {
  return (
    <input
      {...restProps}
      className={cn(
        'bg-light-secondary dark:bg-dark-secondary px-3 py-2 flex items-center overflow-hidden border border-light-200 dark:border-dark-200 dark:text-white rounded-lg text-sm',
        className,
      )}
    />
  );
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string; disabled?: boolean }[];
}

export const Select = ({ className, options, ...restProps }: SelectProps) => {
  return (
    <select
      {...restProps}
      className={cn(
        'bg-light-secondary dark:bg-dark-secondary px-3 py-2 flex items-center overflow-hidden border border-light-200 dark:border-dark-200 dark:text-white rounded-lg text-sm',
        className,
      )}
    >
      {options.map(({ label, value, disabled }) => {
        return (
          <option key={value} value={value} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </select>
  );
};

interface SettingsType {
  chatModelProviders: {
    [key: string]: [Record<string, any>];
  };
  embeddingModelProviders: {
    [key: string]: [Record<string, any>];
  };
  openaiApiKey: string;
  groqApiKey: string;
  anthropicApiKey: string;
  ollamaApiUrl: string;
}

const SettingsDialog = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const [config, setConfig] = useState<SettingsType | null>(null);
  const [chatModels, setChatModels] = useState<Record<string, any>>({});
  const [embeddingModels, setEmbeddingModels] = useState<Record<string, any>>(
    {},
  );
  const [selectedChatModelProvider, setSelectedChatModelProvider] = useState<
    string | null
  >(null);
  const [selectedChatModel, setSelectedChatModel] = useState<string | null>(
    null,
  );
  const [selectedEmbeddingModelProvider, setSelectedEmbeddingModelProvider] =
    useState<string | null>(null);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<
    string | null
  >(null);
  const [customOpenAIApiKey, setCustomOpenAIApiKey] = useState<string>('');
  const [customOpenAIBaseURL, setCustomOpenAIBaseURL] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cookies, setCookie] = useCookies(['authEnabled', 'authUsername', 'authPassword']);

  useEffect(() => {
    if (isOpen) {
      const fetchConfig = async () => {
        setIsLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = (await res.json()) as SettingsType;
        setConfig(data);

        const chatModelProvidersKeys = Object.keys(
          data.chatModelProviders || {},
        );
        const embeddingModelProvidersKeys = Object.keys(
          data.embeddingModelProviders || {},
        );

        const defaultChatModelProvider =
          chatModelProvidersKeys.length > 0 ? chatModelProvidersKeys[0] : '';
        const defaultEmbeddingModelProvider =
          embeddingModelProvidersKeys.length > 0
            ? embeddingModelProvidersKeys[0]
            : '';

        const chatModelProvider =
          localStorage.getItem('chatModelProvider') ||
          defaultChatModelProvider ||
          '';
        const chatModel =
          localStorage.getItem('chatModel') ||
          (data.chatModelProviders &&
            data.chatModelProviders[chatModelProvider]?.[0].name) ||
          '';
        const embeddingModelProvider =
          localStorage.getItem('embeddingModelProvider') ||
          defaultEmbeddingModelProvider ||
          '';
        const embeddingModel =
          localStorage.getItem('embeddingModel') ||
          (data.embeddingModelProviders &&
            data.embeddingModelProviders[embeddingModelProvider]?.[0].name) ||
          '';

        setSelectedChatModelProvider(chatModelProvider);
        setSelectedChatModel(chatModel);
        setSelectedEmbeddingModelProvider(embeddingModelProvider);
        setSelectedEmbeddingModel(embeddingModel);
        setCustomOpenAIApiKey(localStorage.getItem('openAIApiKey') || '');
        setCustomOpenAIBaseURL(localStorage.getItem('openAIBaseURL') || '');
        setChatModels(data.chatModelProviders || {});
        setEmbeddingModels(data.embeddingModelProviders || {});
        setIsLoading(false);
      };

      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsUpdating(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      localStorage.setItem('chatModelProvider', selectedChatModelProvider!);
      localStorage.setItem('chatModel', selectedChatModel!);
      localStorage.setItem(
        'embeddingModelProvider',
        selectedEmbeddingModelProvider!,
      );
      localStorage.setItem('embeddingModel', selectedEmbeddingModel!);
      localStorage.setItem('openAIApiKey', customOpenAIApiKey!);
      localStorage.setItem('openAIBaseURL', customOpenAIBaseURL!);
    } catch (err) {
      console.log(err);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);

      window.location.reload();
    }
  };

  const saveAuthSettings = async () => {
    if (authEnabled && (!username || !password)) {
      // Show an error message or handle the case where fields are empty
      return;
    }
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: authEnabled, username, password }),
      });
      
      // Set cookies
      setCookie('authEnabled', authEnabled, { path: '/' });
      if (authEnabled) {
        setCookie('authUsername', username, { path: '/' });
        setCookie('authPassword', password, { path: '/' });
      } else {
        setCookie('authUsername', '', { path: '/', maxAge: -1 });
        setCookie('authPassword', '', { path: '/', maxAge: -1 });
      }
      
      // Show success message
    } catch (error) {
      console.error('Failed to save auth settings:', error);
      // Show error message
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setIsOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-200"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-xl font-medium leading-6 dark:text-white">
                  Settings
                </Dialog.Title>
                {config && !isLoading && (
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        Theme
                      </p>
                      <ThemeSwitcher />
                    </div>
                    {config.chatModelProviders && (
                      <div className="flex flex-col space-y-1">
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          Chat model Provider
                        </p>
                        <Select
                          value={selectedChatModelProvider ?? undefined}
                          onChange={(e) => {
                            setSelectedChatModelProvider(e.target.value);
                            if (e.target.value === 'custom_openai') {
                              setSelectedChatModel('');
                            } else {
                              setSelectedChatModel(
                                config.chatModelProviders[e.target.value][0]
                                  .name,
                              );
                            }
                          }}
                          options={Object.keys(config.chatModelProviders).map(
                            (provider) => ({
                              value: provider,
                              label:
                                provider.charAt(0).toUpperCase() +
                                provider.slice(1),
                            }),
                          )}
                        />
                      </div>
                    )}
                    {selectedChatModelProvider &&
                      selectedChatModelProvider != 'custom_openai' && (
                        <div className="flex flex-col space-y-1">
                          <p className="text-black/70 dark:text-white/70 text-sm">
                            Chat Model
                          </p>
                          <Select
                            value={selectedChatModel ?? undefined}
                            onChange={(e) =>
                              setSelectedChatModel(e.target.value)
                            }
                            options={(() => {
                              const chatModelProvider =
                                config.chatModelProviders[
                                  selectedChatModelProvider
                                ];

                              return chatModelProvider
                                ? chatModelProvider.length > 0
                                  ? chatModelProvider.map((model) => ({
                                      value: model.name,
                                      label: model.displayName,
                                    }))
                                  : [
                                      {
                                        value: '',
                                        label: 'No models available',
                                        disabled: true,
                                      },
                                    ]
                                : [
                                    {
                                      value: '',
                                      label:
                                        'Invalid provider, please check backend logs',
                                      disabled: true,
                                    },
                                  ];
                            })()}
                          />
                        </div>
                      )}
                    {selectedChatModelProvider &&
                      selectedChatModelProvider === 'custom_openai' && (
                        <>
                          <div className="flex flex-col space-y-1">
                            <p className="text-black/70 dark:text-white/70 text-sm">
                              Model name
                            </p>
                            <Input
                              type="text"
                              placeholder="Model name"
                              defaultValue={selectedChatModel!}
                              onChange={(e) =>
                                setSelectedChatModel(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <p className="text-black/70 dark:text-white/70 text-sm">
                              Custom OpenAI API Key
                            </p>
                            <Input
                              type="text"
                              placeholder="Custom OpenAI API Key"
                              defaultValue={customOpenAIApiKey!}
                              onChange={(e) =>
                                setCustomOpenAIApiKey(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <p className="text-black/70 dark:text-white/70 text-sm">
                              Custom OpenAI Base URL
                            </p>
                            <Input
                              type="text"
                              placeholder="Custom OpenAI Base URL"
                              defaultValue={customOpenAIBaseURL!}
                              onChange={(e) =>
                                setCustomOpenAIBaseURL(e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}
                    {/* Embedding models */}
                    {config.embeddingModelProviders && (
                      <div className="flex flex-col space-y-1">
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          Embedding model Provider
                        </p>
                        <Select
                          value={selectedEmbeddingModelProvider ?? undefined}
                          onChange={(e) => {
                            setSelectedEmbeddingModelProvider(e.target.value);
                            setSelectedEmbeddingModel(
                              config.embeddingModelProviders[e.target.value][0]
                                .name,
                            );
                          }}
                          options={Object.keys(
                            config.embeddingModelProviders,
                          ).map((provider) => ({
                            label:
                              provider.charAt(0).toUpperCase() +
                              provider.slice(1),
                            value: provider,
                          }))}
                        />
                      </div>
                    )}
                    {selectedEmbeddingModelProvider && (
                      <div className="flex flex-col space-y-1">
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          Embedding Model
                        </p>
                        <Select
                          value={selectedEmbeddingModel ?? undefined}
                          onChange={(e) =>
                            setSelectedEmbeddingModel(e.target.value)
                          }
                          options={(() => {
                            const embeddingModelProvider =
                              config.embeddingModelProviders[
                                selectedEmbeddingModelProvider
                              ];

                            return embeddingModelProvider
                              ? embeddingModelProvider.length > 0
                                ? embeddingModelProvider.map((model) => ({
                                    label: model.displayName,
                                    value: model.name,
                                  }))
                                : [
                                    {
                                      label: 'No embedding models available',
                                      value: '',
                                      disabled: true,
                                    },
                                  ]
                              : [
                                  {
                                    label:
                                      'Invalid provider, please check backend logs',
                                    value: '',
                                    disabled: true,
                                  },
                                ];
                          })()}
                        />
                      </div>
                    )}
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        OpenAI API Key
                      </p>
                      <Input
                        type="text"
                        placeholder="OpenAI API Key"
                        defaultValue={config.openaiApiKey}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            openaiApiKey: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        Ollama API URL
                      </p>
                      <Input
                        type="text"
                        placeholder="Ollama API URL"
                        defaultValue={config.ollamaApiUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ollamaApiUrl: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        GROQ API Key
                      </p>
                      <Input
                        type="text"
                        placeholder="GROQ API Key"
                        defaultValue={config.groqApiKey}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            groqApiKey: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        Anthropic API Key
                      </p>
                      <Input
                        type="text"
                        placeholder="Anthropic API key"
                        defaultValue={config.anthropicApiKey}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            anthropicApiKey: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        Enable Authentication
                      </p>
                      <Switch
                        checked={authEnabled}
                        onChange={setAuthEnabled}
                        className={`${
                          authEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      >
                        <span className="sr-only">Enable Authentication</span>
                        <span
                          className={`${
                            authEnabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                      </Switch>
                    </div>
                    {authEnabled && (
                      <>
                        <div className="flex flex-col space-y-1">
                          <p className="text-black/70 dark:text-white/70 text-sm">
                            Username
                          </p>
                          <Input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <p className="text-black/70 dark:text-white/70 text-sm">
                            Password
                          </p>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={saveAuthSettings}
                          className="bg-green-500 flex flex-row items-center space-x-2 text-white disabled:text-white/50 hover:bg-opacity-85 transition duration-100 disabled:bg-opacity-50 rounded-full px-4 py-2"
                          disabled={!username || !password}
                        >
                          Confirm Auth Settings
                        </button>
                      </>
                    )}
                  </div>
                )}
                {isLoading && (
                  <div className="w-full flex items-center justify-center mt-6 text-black/70 dark:text-white/70 py-6">
                    <RefreshCcw className="animate-spin" />
                  </div>
                )}
                <div className="w-full mt-6 space-y-2">
                  <p className="text-xs text-black/50 dark:text-white/50">
                    We&apos;ll refresh the page after updating the settings.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSubmit}
                      className="bg-[#24A0ED] flex flex-row items-center space-x-2 text-white disabled:text-white/50 hover:bg-opacity-85 transition duration-100 disabled:bg-[#ececec21] rounded-full px-4 py-2"
                      disabled={isLoading || isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <CloudUpload size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SettingsDialog;