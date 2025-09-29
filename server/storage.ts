import { supabaseAdmin } from "./services/supabase";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  institutions, venues, users, groups, athletes, events, publications, notifications,
  provinces, cities, colaboradores,
  type Institution, type InsertInstitution,
  type Venue, type InsertVenue,
  type User, type InsertUser,
  type Group, type InsertGroup,
  type Athlete, type InsertAthlete,
  type Event, type InsertEvent,
  type Publication, type InsertPublication,
  type Notification, type InsertNotification,
  type Province, type InsertProvince,
  type City, type InsertCity,
  type Colaborador, type InsertColaborador
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Initialize Drizzle client as fallback with timeout settings
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 300
});
const db = drizzle(client);

export interface IStorage {
  // Institutions
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, updates: Partial<InsertInstitution>): Promise<Institution>;
  deleteInstitution(id: string): Promise<void>;
  
  // Venues
  getVenues(institutionId?: string): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, updates: Partial<InsertVenue>): Promise<Venue>;
  
  // Users
  getUsers(institutionId?: string): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Groups
  getGroups(institutionId?: string, venueId?: string): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group>;
  
  // Athletes
  getAthletes(institutionId?: string, groupId?: string): Promise<Athlete[]>;
  getAthlete(id: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete>;
  
  // Events
  getEvents(institutionId?: string, venueId?: string, groupId?: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event>;
  
  // Publications
  getPublications(institutionId?: string, venueId?: string, groupId?: string): Promise<Publication[]>;
  getPublication(id: string): Promise<Publication | undefined>;
  createPublication(publication: InsertPublication): Promise<Publication>;
  updatePublication(id: string, updates: Partial<InsertPublication>): Promise<Publication>;
  
  // Notifications
  getNotifications(institutionId?: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  
  // Provinces
  getProvinces(): Promise<Province[]>;
  getProvince(id: string): Promise<Province | undefined>;
  createProvince(province: InsertProvince): Promise<Province>;
  
  // Cities - Now related to provinces
  getCities(provinceId?: string): Promise<City[]>;
  getCity(id: string): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;
  
  // Colaboradores (Staff members)
  getColaboradores(institutionId?: string): Promise<Colaborador[]>;
  getColaboradorByUserId(userId: string): Promise<Colaborador | undefined>;
  createColaborador(colaborador: InsertColaborador): Promise<Colaborador>;
  updateColaborador(id: string, updates: Partial<InsertColaborador>): Promise<Colaborador>;
  deleteColaborador(id: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(institutionId?: string, venueId?: string): Promise<any>;
}

export class DrizzleStorage implements IStorage {
  async getInstitutions(): Promise<Institution[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database fields to frontend format
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        logoUrl: item.logo_url,
        primaryColor: item.primary_color,
        secondaryColor: item.secondary_color,
        accentColor: item.accent_color,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error getting institutions:', error);
      return [];
    }
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('institutions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return undefined; // No rows found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error getting institution:', error);
      return undefined;
    }
  }

  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    try {
      const { data, error } = await supabaseAdmin
        .from('institutions')
        .insert({
          name: institution.name,
          description: institution.description,
          logo_url: institution.logoUrl,
          primary_color: institution.primaryColor,
          secondary_color: institution.secondaryColor,
          accent_color: institution.accentColor,
          is_active: institution.isActive ?? true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating institution:', error);
        throw new Error(error.message);
      }
      
      // Map back to frontend format
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        logoUrl: data.logo_url,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        accentColor: data.accent_color,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating institution:', error);
      throw error;
    }
  }

  async updateInstitution(id: string, updates: Partial<InsertInstitution>): Promise<Institution> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
      if (updates.primaryColor !== undefined) updateData.primary_color = updates.primaryColor;
      if (updates.secondaryColor !== undefined) updateData.secondary_color = updates.secondaryColor;
      if (updates.accentColor !== undefined) updateData.accent_color = updates.accentColor;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      
      const { data, error } = await supabaseAdmin
        .from('institutions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating institution:', error);
        throw new Error(error.message);
      }
      
      // Map back to frontend format
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        logoUrl: data.logo_url,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        accentColor: data.accent_color,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating institution:', error);
      throw error;
    }
  }

  async deleteInstitution(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('institutions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting institution:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting institution:', error);
      throw error;
    }
  }

  async getVenues(institutionId?: string): Promise<Venue[]> {
    let query = db.select().from(venues).where(eq(venues.isActive, true));
    if (institutionId) {
      query = query.where(eq(venues.institutionId, institutionId));
    }
    return await query;
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const result = await db.select().from(venues).where(eq(venues.id, id));
    return result[0];
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const result = await db.insert(venues).values(venue).returning();
    return result[0];
  }

  async updateVenue(id: string, updates: Partial<InsertVenue>): Promise<Venue> {
    const result = await db.update(venues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(venues.id, id))
      .returning();
    return result[0];
  }

  async getUsers(institutionId?: string): Promise<User[]> {
    try {
      let query = supabaseAdmin
        .from('users')
        .select('*')
        .eq('is_active', true);
      
      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getGroups(institutionId?: string, venueId?: string): Promise<Group[]> {
    let query = db.select().from(groups).where(eq(groups.isActive, true));
    if (institutionId) {
      query = query.where(eq(groups.institutionId, institutionId));
    }
    if (venueId) {
      query = query.where(eq(groups.venueId, venueId));
    }
    return await query;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id));
    return result[0];
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(group).returning();
    return result[0];
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group> {
    const result = await db.update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return result[0];
  }

  async getAthletes(institutionId?: string, groupId?: string): Promise<Athlete[]> {
    let query = db.select().from(athletes).where(eq(athletes.isActive, true));
    if (institutionId) {
      query = query.where(eq(athletes.institutionId, institutionId));
    }
    if (groupId) {
      query = query.where(eq(athletes.groupId, groupId));
    }
    return await query;
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.id, id));
    return result[0];
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const result = await db.insert(athletes).values(athlete).returning();
    return result[0];
  }

  async updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete> {
    const result = await db.update(athletes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(athletes.id, id))
      .returning();
    return result[0];
  }

  async getEvents(institutionId?: string, venueId?: string, groupId?: string): Promise<Event[]> {
    let query = db.select().from(events).orderBy(desc(events.startTime));
    if (institutionId) {
      query = query.where(eq(events.institutionId, institutionId));
    }
    if (venueId) {
      query = query.where(eq(events.venueId, venueId));
    }
    if (groupId) {
      query = query.where(eq(events.groupId, groupId));
    }
    return await query;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event> {
    const result = await db.update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async getPublications(institutionId?: string, venueId?: string, groupId?: string): Promise<Publication[]> {
    let query = db.select().from(publications)
      .where(eq(publications.status, "publicada"))
      .orderBy(desc(publications.createdAt));
    
    if (institutionId) {
      query = query.where(eq(publications.institutionId, institutionId));
    }
    if (venueId) {
      query = query.where(eq(publications.venueId, venueId));
    }
    if (groupId) {
      query = query.where(eq(publications.groupId, groupId));
    }
    return await query;
  }

  async getPublication(id: string): Promise<Publication | undefined> {
    const result = await db.select().from(publications).where(eq(publications.id, id));
    return result[0];
  }

  async createPublication(publication: InsertPublication): Promise<Publication> {
    const result = await db.insert(publications).values(publication).returning();
    return result[0];
  }

  async updatePublication(id: string, updates: Partial<InsertPublication>): Promise<Publication> {
    const result = await db.update(publications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(publications.id, id))
      .returning();
    return result[0];
  }

  async getNotifications(institutionId?: string): Promise<Notification[]> {
    let query = db.select().from(notifications).orderBy(desc(notifications.createdAt));
    if (institutionId) {
      query = query.where(eq(notifications.institutionId, institutionId));
    }
    return await query;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getDashboardStats(institutionId?: string, venueId?: string): Promise<any> {
    try {
      // Use simple Supabase queries to avoid timeouts
      const [usersResult, institutionsResult, venuesResult, eventsResult] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('institutions').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('venues').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('events').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalInstitutions: institutionsResult.count || 0,
        totalVenues: venuesResult.count || 0,
        totalEvents: eventsResult.count || 0,
        recentActivity: []
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        totalUsers: 0,
        totalInstitutions: 0,
        totalVenues: 0,
        totalEvents: 0,
        recentActivity: []
      };
    }
  }

  // Provinces methods
  async getProvinces(): Promise<Province[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('provinces')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        country: item.country,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Provinces error:', error);
      return [];
    }
  }

  async getProvince(id: string): Promise<Province | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('provinces')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      
      return {
        id: data.id,
        name: data.name,
        country: data.country,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Province error:', error);
      return undefined;
    }
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    const { data, error } = await supabaseAdmin
      .from('provinces')
      .insert({
        name: province.name,
        country: province.country ?? 'Ecuador',
        is_active: province.isActive ?? true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      country: data.country,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Cities methods - Now related to provinces
  async getCities(provinceId?: string): Promise<City[]> {
    try {
      let query = supabaseAdmin
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (provinceId) {
        query = query.eq('province_id', provinceId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        provinceId: item.province_id,
        name: item.name,
        isPrincipal: item.is_principal,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Cities error:', error);
      return [];
    }
  }

  async getCity(id: string): Promise<City | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      
      return {
        id: data.id,
        provinceId: data.province_id,
        name: data.name,
        isPrincipal: data.is_principal,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('City error:', error);
      return undefined;
    }
  }

  async createCity(city: InsertCity): Promise<City> {
    const { data, error } = await supabaseAdmin
      .from('cities')
      .insert({
        province_id: city.provinceId,
        name: city.name,
        is_principal: city.isPrincipal ?? false,
        is_active: city.isActive ?? true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      provinceId: data.province_id,
      name: data.name,
      isPrincipal: data.is_principal,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Colaboradores methods
  async getColaboradores(institutionId?: string): Promise<Colaborador[]> {
    try {
      let query = supabaseAdmin
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        institutionId: item.institution_id,
        customRoleId: item.custom_role_id,
        cityId: item.city_id,
        cedula: item.cedula,
        birthDate: item.birth_date,
        address: item.address,
        startContract: item.start_contract,
        endContract: item.end_contract,
        observations: item.observations,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Colaboradores error:', error);
      return [];
    }
  }

  async getColaboradorByUserId(userId: string): Promise<Colaborador | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('colaboradores')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) return undefined;
      
      return {
        id: data.id,
        userId: data.user_id,
        institutionId: data.institution_id,
        customRoleId: data.custom_role_id,
        cityId: data.city_id,
        cedula: data.cedula,
        birthDate: data.birth_date,
        address: data.address,
        startContract: data.start_contract,
        endContract: data.end_contract,
        observations: data.observations,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Colaborador by userId error:', error);
      return undefined;
    }
  }

  async createColaborador(colaborador: InsertColaborador): Promise<Colaborador> {
    // Clean date fields - convert empty strings to null for PostgreSQL compatibility
    const cleanBirthDate = colaborador.birthDate === "" || colaborador.birthDate === undefined ? null : colaborador.birthDate;
    const cleanStartContract = colaborador.startContract === "" || colaborador.startContract === undefined ? null : colaborador.startContract;
    const cleanEndContract = colaborador.endContract === "" || colaborador.endContract === undefined ? null : colaborador.endContract;
    
    const { data, error } = await supabaseAdmin
      .from('colaboradores')
      .insert({
        user_id: colaborador.userId,
        institution_id: colaborador.institutionId,
        custom_role_id: colaborador.customRoleId,
        city_id: colaborador.cityId,
        cedula: colaborador.cedula,
        birth_date: cleanBirthDate,
        address: colaborador.address,
        start_contract: cleanStartContract,
        end_contract: cleanEndContract,
        observations: colaborador.observations,
        is_active: colaborador.isActive ?? true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      institutionId: data.institution_id,
      customRoleId: data.custom_role_id,
      cityId: data.city_id,
      cedula: data.cedula,
      birthDate: data.birth_date,
      address: data.address,
      startContract: data.start_contract,
      endContract: data.end_contract,
      observations: data.observations,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateColaborador(id: string, updates: Partial<InsertColaborador>): Promise<Colaborador> {
    const updateData: any = {};
    
    if (updates.institutionId !== undefined) updateData.institution_id = updates.institutionId;
    if (updates.customRoleId !== undefined) updateData.custom_role_id = updates.customRoleId;
    if (updates.cityId !== undefined) updateData.city_id = updates.cityId;
    if (updates.cedula !== undefined) updateData.cedula = updates.cedula;
    // Clean date fields - convert empty strings to null for PostgreSQL compatibility
    if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate === "" ? null : updates.birthDate;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.startContract !== undefined) updateData.start_contract = updates.startContract === "" ? null : updates.startContract;
    if (updates.endContract !== undefined) updateData.end_contract = updates.endContract === "" ? null : updates.endContract;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('colaboradores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      institutionId: data.institution_id,
      customRoleId: data.custom_role_id,
      cityId: data.city_id,
      cedula: data.cedula,
      birthDate: data.birth_date,
      address: data.address,
      startContract: data.start_contract,
      endContract: data.end_contract,
      observations: data.observations,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async deleteColaborador(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('colaboradores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const storage = new DrizzleStorage();
