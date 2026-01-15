import { create } from 'zustand';

const useLocationStore = create((set, get) => ({
  // 存放位置列表
  locations: [],
  // 当前编辑的位置
  currentLocation: null,
  // 加载状态
  loading: false,
  // 错误信息
  error: null,

  // 添加存放位置
  addLocation: (location) => set((state) => ({
    locations: [...state.locations, { ...location, id: Date.now().toString() }]
  })),

  // 更新存放位置
  updateLocation: (locationId, updates) => set((state) => ({
    locations: state.locations.map((location) =>
      location.id === locationId ? { ...location, ...updates } : location
    )
  })),

  // 删除存放位置
  deleteLocation: (locationId) => set((state) => ({
    locations: state.locations.filter((location) => location.id !== locationId)
  })),

  // 设置当前编辑的位置
  setCurrentLocation: (location) => set({ currentLocation: location }),

  // 清空当前编辑的位置
  clearCurrentLocation: () => set({ currentLocation: null }),

  // 设置加载状态
  setLoading: (loading) => set({ loading }),

  // 设置错误信息
  setError: (error) => set({ error }),

  // 根据ID获取位置
  getLocationById: (locationId) => get().locations.find((location) => location.id === locationId),

  // 根据父级ID获取子位置
  getLocationsByParent: (parentId) => get().locations.filter((location) => location.parent === parentId),

  // 获取所有根位置（没有父级的位置）
  getRootLocations: () => get().locations.filter((location) => !location.parent),

  // 搜索存放位置
  searchLocations: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().locations.filter((location) =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.description.toLowerCase().includes(lowerQuery) ||
      location.type.toLowerCase().includes(lowerQuery)
    );
  }
}));

export default useLocationStore;