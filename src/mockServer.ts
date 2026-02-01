/**
 * Mock API Server
 * Simulates backend API responses for development
 */

import { Site, Alarm } from '@/types';

// Mock data
const mockSites: Site[] = [
  {
    id: '1',
    name: 'Warehouse A',
    location: 'New York, NY',
    status: 'active',
    temperature: 22.5,
    humidity: 45,
    alarmCount: 2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Warehouse B',
    location: 'Los Angeles, CA',
    status: 'active',
    temperature: 24.1,
    humidity: 38,
    alarmCount: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Distribution Center',
    location: 'Chicago, IL',
    status: 'maintenance',
    temperature: 20.0,
    humidity: 50,
    alarmCount: 1,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Regional Hub',
    location: 'Houston, TX',
    status: 'active',
    temperature: 23.8,
    humidity: 42,
    alarmCount: 3,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Storage Facility',
    location: 'Miami, FL',
    status: 'active',
    temperature: 25.5,
    humidity: 55,
    alarmCount: 0,
    lastUpdated: new Date().toISOString(),
  },
];

const mockAlarms: Alarm[] = [
  {
    id: '1',
    siteId: '1',
    type: 'temperature',
    message: 'Temperature exceeds threshold (>25°C)',
    status: 'active',
    severity: 'high',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: '2',
    siteId: '1',
    type: 'humidity',
    message: 'Humidity below minimum threshold (<30%)',
    status: 'active',
    severity: 'medium',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: '3',
    siteId: '3',
    type: 'system',
    message: 'Maintenance mode activated',
    status: 'acknowledged',
    severity: 'low',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: '4',
    siteId: '4',
    type: 'temperature',
    message: 'Temperature exceeds threshold (>26°C)',
    status: 'active',
    severity: 'high',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '5',
    siteId: '4',
    type: 'power',
    message: 'Backup power system battery low',
    status: 'resolved',
    severity: 'medium',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

/**
 * Simulate API delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API handlers
 */
export const mockApiHandlers = {
  /**
   * GET /api/sites
   */
  async getSites(page: number = 1, limit: number = 10) {
    await delay(500);
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = mockSites.slice(start, end);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total: mockSites.length,
        totalPages: Math.ceil(mockSites.length / limit),
      },
    };
  },

  /**
   * GET /api/sites/:id
   */
  async getSiteById(id: string) {
    await delay(300);
    const site = mockSites.find((s) => s.id === id);
    if (!site) throw new Error('Site not found');
    return site;
  },

  /**
   * POST /api/sites
   */
  async createSite(data: Partial<Site>) {
    await delay(400);
    const newSite: Site = {
      id: String(mockSites.length + 1),
      name: data.name || 'New Site',
      location: data.location || 'Unknown',
      status: 'active',
      temperature: 22,
      humidity: 50,
      alarmCount: 0,
      lastUpdated: new Date().toISOString(),
    };
    mockSites.push(newSite);
    return newSite;
  },

  /**
   * PUT /api/sites/:id
   */
  async updateSite(id: string, data: Partial<Site>) {
    await delay(400);
    const site = mockSites.find((s) => s.id === id);
    if (!site) throw new Error('Site not found');
    Object.assign(site, data, { lastUpdated: new Date().toISOString() });
    return site;
  },

  /**
   * DELETE /api/sites/:id
   */
  async deleteSite(id: string) {
    await delay(300);
    const index = mockSites.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Site not found');
    mockSites.splice(index, 1);
    return { success: true };
  },

  /**
   * GET /api/alarms
   */
  async getAlarms(page: number = 1, limit: number = 10) {
    await delay(500);
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = mockAlarms.slice(start, end);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total: mockAlarms.length,
        totalPages: Math.ceil(mockAlarms.length / limit),
      },
    };
  },

  /**
   * PATCH /api/alarms/:id
   */
  async updateAlarm(id: string, data: Partial<Alarm>) {
    await delay(300);
    const alarm = mockAlarms.find((a) => a.id === id);
    if (!alarm) throw new Error('Alarm not found');
    Object.assign(alarm, data);
    return alarm;
  },
};
