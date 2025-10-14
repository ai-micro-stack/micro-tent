type GuiContext = {
  platId: number | null;
  nicTreeId: number;
  subnetId: number;
  pxeId: number | null;
  clusterId: number | null;
  pageSize: number | null;
  pageIndex: number | null;
};

const noneGuiContext: GuiContext = {
  platId: 0,
  nicTreeId: 1,
  subnetId: 0,
  pxeId: null,
  clusterId: null,
  pageSize: null,
  pageIndex: null,
};

function storeGuiContext(contextStore: string, curContext: GuiContext) {
  localStorage.setItem(contextStore, JSON.stringify(curContext));
}

function fetchGuiContext(contextStore: string): GuiContext {
  const curContext = localStorage.getItem(contextStore);
  return curContext === null ? noneGuiContext : JSON.parse(curContext);
}

export { storeGuiContext, fetchGuiContext };
