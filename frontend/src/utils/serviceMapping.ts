// 服务类型映射配置
// 将前端的服务类型标识符映射到数据库中的实际服务ID

export interface ServiceMapping {
  frontendId: string;
  databaseId: string;
  name: string;
  basePrice: number;
}

// 根据主页服务项目和数据库查询结果创建的映射表
export const SERVICE_MAPPINGS: ServiceMapping[] = [
  {
    frontendId: 'system-reinstall',
    databaseId: '0c3cb522-9cb6-495e-8d86-edcabc27004c',
    name: '系统重装',
    basePrice: 50
  },
  {
    frontendId: 'cleaning',
    databaseId: '66cfe81e-250b-422e-9e16-d6d18ff8ce2e',
    name: '清灰服务',
    basePrice: 30
  },
  {
    frontendId: 'software-install',
    databaseId: '4363c4f4-55b1-4151-bae2-47197eb8ef6f',
    name: '软件安装',
    basePrice: 20
  },
  {
    frontendId: 'water-damage',
    databaseId: 'b2fc7a9a-ffaa-4d09-8e9c-0e91b9ff7774',
    name: '电脑进水',
    basePrice: 100
  },
  {
    frontendId: 'battery-replacement',
    databaseId: 'f4a8b2c1-1234-5678-9abc-def012345678',
    name: '手机电池更换',
    basePrice: 80
  },
  {
    frontendId: 'screen-replacement',
    databaseId: 'a908380e-39d9-43ab-8c91-355d9834ad99',
    name: '手机屏幕更换',
    basePrice: 150
  }
];

/**
 * 根据数据库服务ID获取前端服务信息
 * @param databaseId 数据库服务UUID
 * @returns 服务映射信息
 */
export function getServiceMappingByDatabaseId(databaseId: string): ServiceMapping | null {
  return SERVICE_MAPPINGS.find(m => m.databaseId === databaseId) || null;
}

/**
 * 根据服务名称获取前端服务信息
 * @param serviceName 服务名称
 * @returns 服务映射信息
 */
export function getServiceMappingByName(serviceName: string): ServiceMapping | null {
  return SERVICE_MAPPINGS.find(m => m.name === serviceName) || null;
}

/**
 * 根据前端服务类型ID获取数据库服务ID
 * @param frontendId 前端服务类型标识符
 * @returns 数据库中的服务UUID
 */
export function getDatabaseServiceId(frontendId: string): string | null {
  const mapping = SERVICE_MAPPINGS.find(m => m.frontendId === frontendId);
  return mapping ? mapping.databaseId : null;
}

/**
 * 根据前端服务类型ID获取服务信息
 * @param frontendId 前端服务类型标识符
 * @returns 服务映射信息
 */
export function getServiceMapping(frontendId: string): ServiceMapping | null {
  return SERVICE_MAPPINGS.find(m => m.frontendId === frontendId) || null;
}

/**
 * 获取所有可用的服务选项（用于前端下拉框）
 * @returns 服务选项数组
 */
export function getServiceOptions() {
  return SERVICE_MAPPINGS.map(mapping => ({
    value: mapping.frontendId,
    label: mapping.name,
    basePrice: mapping.basePrice
  }));
}