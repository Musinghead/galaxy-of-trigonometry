//============================================================================
// PROJECT ID:
//
// GROUP NUMBER: 1
//
// STUDENT NAME: 
// NUS User ID.: 
//
// STUDENT NAME: 
// NUS User ID.: 
//
// STUDENT NAME: Kuang Zhiyi
// NUS User ID.: t0918062
//
// COMMENTS TO GRADER: 
//
//============================================================================


// FRAGMENT SHADER FOR SHADERTOY
// Run this at https://www.shadertoy.com/new
// See documentation at https://www.shadertoy.com/howto

// Your browser must support WebGL 2.0.
// Check your browser at http://webglreport.com/?v=2


//============================================================================
// Constants.
//============================================================================
const int NUM_LIGHTS = 1;
const int NUM_MATERIALS = 7;
const int NUM_PLANES = 2;
const int NUM_SPHERES = 4;
const int NUM_BOXES = 4;

const vec3 BACKGROUND_COLOR = vec3( 0.1, 0.2, 0.6 );

const float PI = 3.1415926535;
 // Vertical field-of-view angle of camera. In radians.
const float FOVY = 50.0 * 3.1415926535 / 180.0; 

// Use this for avoiding the "epsilon problem" or the shadow acne problem.
const float DEFAULT_TMIN = 10.0e-4;

// Use this for tmax for non-shadow ray intersection test.
const float DEFAULT_TMAX = 10.0e6;

// Equivalent to number of recursion levels (0 means ray-casting only).
// We are using iterations to replace recursions.
const int NUM_ITERATIONS = 2;

// center of global scene
const vec3 global_center = vec3(0.0, 0.0, 10.0);
// scene 1, size of box track
const float track_L = 8.0;
const float track_H = 4.0;
const float track_W = 0.4;

//============================================================================
// Define new struct types.
//============================================================================
struct Ray_t {
    vec3 o;  // Ray Origin.
    vec3 d;  // Ray Direction. A unit vector.
};

struct Plane_t {
    // The plane equation is Ax + By + Cz + D = 0.
    float A, B, C, D;
    int materialID;
};

struct Sphere_t {
    vec3 center;
    float radius;
    int materialID;
};

struct Box_t {
    vec3 corner1;
    vec3 corner2;
    float angle; // only rotate around y axis
    int materialID;
};

struct Light_t {
    vec3 position;  // Point light 3D position.
    vec3 I_a;       // For Ambient.
    vec3 I_source;  // For Diffuse and Specular.
};

struct Material_t {
    vec3 k_a;   // Ambient coefficient.
    vec3 k_d;   // Diffuse coefficient.
    vec3 k_r;   // Reflected specular coefficient.
    vec3 k_rg;  // Global reflection coefficient.
    float n;    // The specular reflection exponent. Ranges from 0.0 to 128.0. 
};

//----------------------------------------------------------------------------
// The lighting model used here is similar to that on Slides 8 and 12 of 
// Lecture 11 (Ray Tracing). Here it is computed as
//
//     I_local = SUM_OVER_ALL_LIGHTS { 
//                   I_a * k_a + 
//                   k_shadow * I_source * [ k_d * (N.L) + k_r * (R.V)^n ]
//               }
// and
//     I = I_local  +  k_rg * I_reflected
//----------------------------------------------------------------------------


//============================================================================
// Global scene data.
//============================================================================
Plane_t Plane[NUM_PLANES];
Sphere_t Sphere[NUM_SPHERES];
Box_t Box[NUM_BOXES];
Light_t Light[NUM_LIGHTS];
Material_t Material[NUM_MATERIALS];

// Position the camera.
vec3 cam_pos = vec3( 
    global_center.x, 
    15.0, 
    30.0 );
vec3 cam_lookat = vec3( 
    global_center.x, 
    0.0, 
    0.0 );
vec3 cam_up_vec = vec3( 0.0, 1.0, 0.0 );

/////////////////////////////////////////////////////////////////////////////
// Initializes the scene.
/////////////////////////////////////////////////////////////////////////////
void InitScene()
{
    // Horizontal plane.
    Plane[0].A = 0.0;
    Plane[0].B = 1.0;
    Plane[0].C = 0.0;
    Plane[0].D = 0.0;
    Plane[0].materialID = 0;

    // Vertical plane.
    Plane[1].A = 0.0;
    Plane[1].B = 0.0;
    Plane[1].C = 1.0;
    Plane[1].D = 2.0;
    Plane[1].materialID = 6;

    // Center bouncing sphere.
    // Sphere[0].center = vec3( 0.0, abs(sin(2.0 * iTime)) + 0.7, 0.0 );
    Sphere[0].center = vec3( 
        global_center.x, 
        track_H + 0.5, 
        global_center.z + track_L / 2.0 * sin(2.0 * iTime) );
    Sphere[0].radius = 0.5;
    Sphere[0].materialID = 1;
    
    Sphere[1].center = vec3( 
        global_center.x + track_L / 2.0 * sin(2.0 * iTime + 45.0 / 180.0 * PI) / sqrt(2.0), 
        track_H + 0.5,  
        global_center.z + track_L / 2.0 * sin(2.0 * iTime + 45.0 / 180.0 * PI) / sqrt(2.0));
    Sphere[1].radius = 0.5;
    Sphere[1].materialID = 2;

    Sphere[2].center = vec3( 
        global_center.x + track_L / 2.0 * sin(2.0 * iTime + 90.0 / 180.0 * PI), 
        track_H + 0.5, 
        global_center.z );
    Sphere[2].radius = 0.5;
    Sphere[2].materialID = 3;

    Sphere[3].center = vec3( 
        global_center.x + track_L / 2.0 * sin(2.0 * iTime + 135.0 / 180.0 * PI) / sqrt(2.0), 
        track_H + 0.5,  
        global_center.z - track_L / 2.0 * sin(2.0 * iTime + 135.0 / 180.0 * PI) / sqrt(2.0));
    Sphere[3].radius = 0.5;
    Sphere[3].materialID = 4;

    // track 1
    Box[0].corner1 = vec3(
        global_center.x - track_W / 2.0, 
        0.0, 
        global_center.z - track_L / 2.0);
    Box[0].corner2 = vec3(
        global_center.x + track_W / 2.0, 
        track_H, 
        global_center.z + track_L / 2.0);
    Box[0].angle = 0.0;
    Box[0].materialID = 5;

    // track 2
    Box[1].corner1 = vec3(
        global_center.x - track_L / 2.0, 
        0.0, 
        global_center.z - track_W / 2.0);
    Box[1].corner2 = vec3(
        global_center.x + track_L / 2.0, 
        track_H, 
        global_center.z + track_W / 2.0);
    Box[1].angle = 0.0;
    Box[1].materialID = 5;

    // track 3
    Box[2].corner1 = vec3(
        global_center.x + (track_W / 2.0) / sqrt(2.0) - (track_L / 2.0) / sqrt(2.0), 
        0.0, 
        global_center.z - (track_W / 2.0) / sqrt(2.0) - (track_L / 2.0) / sqrt(2.0));
    Box[2].corner2 = vec3(
        global_center.x - (track_W / 2.0) / sqrt(2.0) + (track_L / 2.0) / sqrt(2.0), 
        track_H, 
        global_center.z + (track_W / 2.0) / sqrt(2.0) + (track_L / 2.0) / sqrt(2.0));
    Box[2].angle = 45.0 / 180.0 * PI;
    Box[2].materialID = 5;

    // track 3
    Box[3].corner1 = vec3(
        global_center.x + (track_W / 2.0) / sqrt(2.0) - (track_L / 2.0) / sqrt(2.0), 
        0.0, 
        global_center.z + (track_W / 2.0) / sqrt(2.0) + (track_L / 2.0) / sqrt(2.0));
    Box[3].corner2 = vec3(
        global_center.x - (track_W / 2.0) / sqrt(2.0) + (track_L / 2.0) / sqrt(2.0), 
        track_H, 
        global_center.z - (track_W / 2.0) / sqrt(2.0) - (track_L / 2.0) / sqrt(2.0));
    Box[3].angle = -45.0 / 180.0 * PI;
    Box[3].materialID = 5;
    
    // Silver material.
    Material[0].k_d = vec3( 0.4, 0.4, 0.4 );
    Material[0].k_a = 0.2 * Material[0].k_d;
    Material[0].k_r = 2.0 * Material[0].k_d;
    Material[0].k_rg = 0.5 * Material[0].k_r;
    Material[0].n = 64.0;

    // blue level 1
    Material[1].k_d = vec3( 0.8, 0.4, 0.4 );
    Material[1].k_a = 0.2 * Material[1].k_d;
    Material[1].k_r = vec3(1.0, 1.0, 1.0);
    Material[1].k_rg = 0.5 * Material[1].k_r;
    Material[1].n = 128.0;

    // blue level 2
    Material[2].k_d = vec3( 0.4, 0.4, 0.8 );
    Material[2].k_a = 0.2 * Material[2].k_d;
    Material[2].k_r = vec3( 1.0, 1.0, 1.0 );
    Material[2].k_rg = 0.5 * Material[2].k_r;
    Material[2].n = 128.0;

    // blue level 3
    Material[3].k_d = vec3( 0.4, 0.4, 0.8 );
    Material[3].k_a = 0.2 * Material[3].k_d;
    Material[3].k_r = vec3( 1.0, 1.0, 1.0 );
    Material[3].k_rg = 0.5 * Material[3].k_r;
    Material[3].n = 128.0;

    // blue level 4
    Material[4].k_d = vec3( 0.4, 0.4, 0.8 );
    Material[4].k_a = 0.2 * Material[4].k_d;
    Material[4].k_r = vec3( 1.0, 1.0, 1.0 );
    Material[4].k_rg = 0.5 * Material[4].k_r;
    Material[4].n = 128.0;

    // box track
    Material[5].k_d = vec3( 1.0, 1.0, 1.0 );
    Material[5].k_a = 0.2 * Material[3].k_d;
    Material[5].k_r = vec3( 1.0, 1.0, 1.0 );
    Material[5].k_rg = 0.5 * Material[3].k_r;
    Material[5].n = 128.0;

    // mirror
    Material[6].k_d = vec3( 0.0, 0.0, 0.0 );
    Material[6].k_a = 0.2 * Material[0].k_d;
    Material[6].k_r = 2.0 * Material[0].k_d;
    Material[6].k_rg = 0.5 * Material[0].k_r;
    Material[6].n = 64.0;

    // Light 0.
    Light[0].position = vec3( 12.0, 18.0, 15.0 );
    Light[0].I_a = vec3( 0.1, 0.1, 0.1 );
    Light[0].I_source = vec3( 1.0, 1.0, 1.0 );

    // Light 1.
    // Light[1].position = vec3( -4.0, 20.0, 3.0 );
    // Light[1].I_a = vec3( 0.1, 0.1, 0.1 );
    // Light[1].I_source = vec3( 0.8, 0.8, 0.8 );
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a plane and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
// If there is such an intersection, outputs the value of t, the position
// of the intersection (hitPos) and the normal vector at the intersection 
// (hitNormal).
/////////////////////////////////////////////////////////////////////////////
bool IntersectPlane( in Plane_t pln, in Ray_t ray, in float tmin, in float tmax,
                     out float t, out vec3 hitPos, out vec3 hitNormal ) 
{
    vec3 N = vec3( pln.A, pln.B, pln.C );
    float NRd = dot( N, ray.d );
    float NRo = dot( N, ray.o );
    float t0 = (-pln.D - NRo) / NRd;
    if ( t0 < tmin || t0 > tmax ) return false;

    // We have a hit -- output results.
    t = t0;
    hitPos = ray.o + t0 * ray.d;
    hitNormal = normalize( N );
    return true;
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a plane and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
/////////////////////////////////////////////////////////////////////////////
bool IntersectPlane( in Plane_t pln, in Ray_t ray, in float tmin, in float tmax )
{
    vec3 N = vec3( pln.A, pln.B, pln.C );
    float NRd = dot( N, ray.d );
    float NRo = dot( N, ray.o );
    float t0 = (-pln.D - NRo) / NRd;
    if ( t0 < tmin || t0 > tmax ) return false;
    return true;
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a sphere and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
// If there is one or two such intersections, outputs the value of the 
// smaller t, the position of the intersection (hitPos) and the normal 
// vector at the intersection (hitNormal).
/////////////////////////////////////////////////////////////////////////////
bool IntersectSphere( in Sphere_t sph, in Ray_t ray, in float tmin, in float tmax,
                      out float t, out vec3 hitPos, out vec3 hitNormal ) 
{
    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////
    Ray_t local_ray = Ray_t(ray.o - sph.center, ray.d);
    float a = 1.0;
    float b = 2.0 * dot(local_ray.d, local_ray.o);
    float c = dot(local_ray.o, local_ray.o) - sph.radius * sph.radius;
    float d = b * b - 4.0 * a * c;
    if ( d <= 0.0 )
        return false;
    
    float t_minus = ( -b - sqrt(d) ) / (2.0 * a);
    float t_plus =  ( -b + sqrt(d) ) / (2.0 * a);
    float t_positive = 0.0;
    
    if ( t_minus > 0.0 )
        t_positive = t_minus;
    else if ( t_plus > 0.0 )
        t_positive = t_plus;
    else
        return false;
    
    if ( t_positive < tmin || t_positive > tmax ) return false;

    t = t_positive;
    hitPos = ray.o + t_positive * ray.d;
    hitNormal = normalize(hitPos - sph.center);
    return true;  // Replace this with your code.

}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a sphere and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
/////////////////////////////////////////////////////////////////////////////
bool IntersectSphere( in Sphere_t sph, in Ray_t ray, in float tmin, in float tmax )
{
    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////
    Ray_t local_ray = Ray_t(ray.o - sph.center, ray.d);
    float a = 1.0;
    float b = 2.0 * dot(local_ray.d, local_ray.o);
    float c = dot(local_ray.o, local_ray.o) - sph.radius * sph.radius;
    float d = b * b - 4.0 * a * c;
    
    if ( d <= 0.0 )
        return false;
        
    float t_minus = ( -b - sqrt(d) ) / (2.0 * a);
    float t_plus =  ( -b + sqrt(d) ) / (2.0 * a);

    float t_positive = 0.0;

    if ( t_minus > 0.0 )
        t_positive = t_minus;
    else if ( t_plus > 0.0 )
        t_positive = t_plus;
    else
        return false;
    
    if ( t_positive < tmin || t_positive > tmax ) return false;

    return true;  // Replace this with your code.

}

bool IntersectBox(in Box_t box, in Ray_t ray, in float tmin, in float tmax,
                  out float t, out vec3 hitPos, out vec3 hitNormal )
{
    Plane_t faces[6];
    vec3 faces_normal[6];
    faces_normal[0] = vec3(-cos(box.angle), 0.0, -sin(box.angle));
    faces_normal[1] = vec3(cos(box.angle), 0.0, sin(box.angle));
    faces_normal[2] = vec3(0.0, -1.0, 0.0);
    faces_normal[3] = vec3(0.0, 1.0, 0.0);
    faces_normal[4] = vec3(sin(box.angle), 0.0, -cos(box.angle));
    faces_normal[5] = vec3(-sin(box.angle), 0.0, cos(box.angle));

    for (int i = 0 ; i < 3 ; i++) {
        faces[2 * i] = Plane_t(faces_normal[2 * i].x, faces_normal[2 * i].y, faces_normal[2 * i].z,
                              -dot(faces_normal[2 * i], box.corner1), box.materialID);
        faces[2 * i + 1] = Plane_t(faces_normal[2 * i + 1].x, faces_normal[2 * i + 1].y, faces_normal[2 * i + 1].z,
                      -dot(faces_normal[2 * i + 1], box.corner2), box.materialID);
    }
    
    float largest_near = tmin;
    float smallest_far = tmax;

    vec3 near_hitPos;
    vec3 near_hitNormal;
    
    for (int i = 0 ; i < 3 ; i++) {
        float t_neg;
        vec3 hitPos_neg;
        vec3 hitNormal_neg;
        bool hashit_neg = IntersectPlane(faces[2 * i], ray, tmin, tmax,
                                         t_neg, hitPos_neg, hitNormal_neg);
        
        float t_pos;
        vec3 hitPos_pos;
        vec3 hitNormal_pos;
        bool hashit_pos = IntersectPlane(faces[2 * i + 1], ray, tmin, tmax,
                                         t_pos, hitPos_pos, hitNormal_pos);
        
        float t_near;
        float t_far;

        if (!hashit_neg && !hashit_pos) {
            float res1 = dot(ray.o, vec3(faces[2 * i].A, faces[2 * i].B, faces[2 * i].C)) + faces[2 * i].D;
            float res2 = dot(ray.o, vec3(faces[2 * i + 1].A, faces[2 * i + 1].B, faces[2 * i + 1].C)) + faces[2 * i + 1].D;
            if (res1 < -tmin && res2 < -tmin)
                continue;
            else 
                return false;
        }
        else if (hashit_neg && !hashit_pos) {
            t_far = t_neg;
            if (smallest_far > t_far)
                smallest_far = t_far;
        }
        else if (!hashit_neg && hashit_pos) {
            t_far = t_pos;
            if (smallest_far > t_far)
                smallest_far = t_far;
        }
        else if (hashit_neg && hashit_pos) {
            t_near = t_neg < t_pos ? t_neg : t_pos;
            t_far = t_neg > t_pos ? t_neg : t_pos;
            if (largest_near < t_near) {
                largest_near = t_near;
                near_hitPos = t_neg < t_pos ? hitPos_neg : hitPos_pos;
                near_hitNormal = t_neg < t_pos ? hitNormal_neg : hitNormal_pos;
            }
            if (smallest_far > t_far) {
                smallest_far = t_far;
            }
        }
    }    
    if (largest_near >= smallest_far) return false;
    t = largest_near;
    hitPos = near_hitPos;
    hitNormal = near_hitNormal;
    // if (!hashit_y_neg) return false;
    // t = t_y_neg;    
    // hitPos = hitPos_y_neg;
    // hitNormal = hitNormal_y_neg;

    return true;
}

bool IntersectBox(in Box_t box, in Ray_t ray, in float tmin, in float tmax)
{
    Plane_t faces[6];
    vec3 faces_normal[6];
    faces_normal[0] = vec3(-cos(box.angle), 0.0, -sin(box.angle));
    faces_normal[1] = vec3(cos(box.angle), 0.0, sin(box.angle));
    faces_normal[2] = vec3(0.0, -1.0, 0.0);
    faces_normal[3] = vec3(0.0, 1.0, 0.0);
    faces_normal[4] = vec3(sin(box.angle), 0.0, -cos(box.angle));
    faces_normal[5] = vec3(-sin(box.angle), 0.0, cos(box.angle));

    for (int i = 0 ; i < 3 ; i++) {
        faces[2 * i] = Plane_t(faces_normal[2 * i].x, faces_normal[2 * i].y, faces_normal[2 * i].z,
                              -dot(faces_normal[2 * i], box.corner1), box.materialID);
        faces[2 * i + 1] = Plane_t(faces_normal[2 * i + 1].x, faces_normal[2 * i + 1].y, faces_normal[2 * i + 1].z,
                      -dot(faces_normal[2 * i + 1], box.corner2), box.materialID);
    }
    float largest_near = tmin;
    float smallest_far = tmax;
    vec3 near_hitPos;
    vec3 near_hitNormal;
    for (int i = 0 ; i < 3 ; i++) {
        float t_neg;
        vec3 hitPos_neg;
        vec3 hitNormal_neg;
        bool hashit_neg = IntersectPlane(faces[2 * i], ray, tmin, tmax,
                                         t_neg, hitPos_neg, hitNormal_neg);
        
        float t_pos;
        vec3 hitPos_pos;
        vec3 hitNormal_pos;
        bool hashit_pos = IntersectPlane(faces[2 * i + 1], ray, tmin, tmax,
                                         t_pos, hitPos_pos, hitNormal_pos);
        
        float t_near;
        float t_far;
        if (!hashit_neg && !hashit_pos) {
            float res1 = dot(ray.o, vec3(faces[2 * i].A, faces[2 * i].B, faces[2 * i].C)) + faces[2 * i].D;
            float res2 = dot(ray.o, vec3(faces[2 * i + 1].A, faces[2 * i + 1].B, faces[2 * i + 1].C)) + faces[2 * i + 1].D;
            if (res1 < -tmin && res2 < -tmin)
                continue;
            else 
                return false;
        }
        else if (hashit_neg && !hashit_pos) {
            t_far = t_neg;
            if (smallest_far > t_far)
                smallest_far = t_far;
        }
        else if (!hashit_neg && hashit_pos) {
            t_far = t_pos;
            if (smallest_far > t_far)
                smallest_far = t_far;
        }
        else {
            t_near = t_neg < t_pos ? t_neg : t_pos;
            t_far = t_neg > t_pos ? t_neg : t_pos;
            if (largest_near < t_near) {
                largest_near = t_near;
                near_hitPos = t_neg < t_pos ? hitPos_neg : hitPos_pos;
                near_hitNormal = t_neg < t_pos ? hitNormal_neg : hitNormal_pos;
            }
            if (smallest_far > t_far) {
                smallest_far = t_far;
            }
        }
    }    
    if (largest_near >= smallest_far) return false;
    return true;   
}

/////////////////////////////////////////////////////////////////////////////
// Computes (I_a * k_a) + k_shadow * I_source * [ k_d * (N.L) + k_r * (R.V)^n ].
// Input vectors L, N and V are pointing AWAY from surface point.
// Assume all vectors L, N and V are unit vectors.
/////////////////////////////////////////////////////////////////////////////
vec3 PhongLighting( in vec3 L, in vec3 N, in vec3 V, in bool inShadow, 
                    in Material_t mat, in Light_t light )
{
    if ( inShadow ) {
        return light.I_a * mat.k_a;
    }
    else {
        vec3 R = reflect( -L, N );
        float N_dot_L = max( 0.0, dot( N, L ) );
        float R_dot_V = max( 0.0, dot( R, V ) );
        float R_dot_V_pow_n = ( R_dot_V == 0.0 )? 0.0 : pow( R_dot_V, mat.n );

        return light.I_a * mat.k_a + 
               light.I_source * (mat.k_d * N_dot_L + mat.k_r * R_dot_V_pow_n);
    }
}


/////////////////////////////////////////////////////////////////////////////
// Casts a ray into the scene and returns color computed at the nearest
// intersection point. The color is the sum of light from all light sources,
// each computed using Phong Lighting Model, with consideration of
// whether the interesection point is being shadowed from the light.
// If there is no interesection, returns the background color, and outputs
// hasHit as false.
// If there is intersection, returns the computed color, and outputs
// hasHit as true, the 3D position of the intersection (hitPos), the
// normal vector at the intersection (hitNormal), and the k_rg value
// of the material of the intersected object.
/////////////////////////////////////////////////////////////////////////////
vec3 CastRay( in Ray_t ray, 
              out bool hasHit, out vec3 hitPos, out vec3 hitNormal, out vec3 k_rg ) 
{
    // Find whether and where the ray hits some object. 
    // Take the nearest hit point.

    bool hasHitSomething = false;
    float nearest_t = DEFAULT_TMAX;   // The ray parameter t at the nearest hit point.
    vec3 nearest_hitPos;              // 3D position of the nearest hit point.
    vec3 nearest_hitNormal;           // Normal vector at the nearest hit point.
    int nearest_hitMatID;             // MaterialID of the object at the nearest hit point.

    float temp_t;
    vec3 temp_hitPos;
    vec3 temp_hitNormal;
    bool temp_hasHit;

    /////////////////////////////////////////////////////////////////////////////
    // TASK:
    // * Try interesecting input ray with all the planes and spheres,
    //   and record the front-most (nearest) interesection.
    // * If there is interesection, need to record hasHitSomething,
    //   nearest_t, nearest_hitPos, nearest_hitNormal, nearest_hitMatID.
    /////////////////////////////////////////////////////////////////////////////

    for (int i = 0 ; i < NUM_PLANES ; i++) {
        temp_hasHit = IntersectPlane(Plane[i], ray, DEFAULT_TMIN, DEFAULT_TMAX, 
                                     temp_t, temp_hitPos, temp_hitNormal);
        if (temp_hasHit && temp_t < nearest_t) {
            hasHitSomething = true;
            nearest_t = temp_t;
            nearest_hitPos = temp_hitPos;
            nearest_hitNormal = temp_hitNormal;
            nearest_hitMatID = Plane[i].materialID;
        }
    }

    for (int i = 0 ; i < NUM_SPHERES ; i++) {
        temp_hasHit = IntersectSphere(Sphere[i], ray, DEFAULT_TMIN, DEFAULT_TMAX, 
                             temp_t, temp_hitPos, temp_hitNormal);
        if (temp_hasHit && temp_t < nearest_t) {
            hasHitSomething = true;
            nearest_t = temp_t;
            nearest_hitPos = temp_hitPos;
            nearest_hitNormal = temp_hitNormal;
            nearest_hitMatID = Sphere[i].materialID;
        }
    }

    for (int i = 0 ; i < NUM_BOXES ; i++) {
        temp_hasHit = IntersectBox(Box[i], ray, DEFAULT_TMIN, DEFAULT_TMAX, 
                             temp_t, temp_hitPos, temp_hitNormal);
        if (temp_hasHit && temp_t < nearest_t) {
            hasHitSomething = true;
            nearest_t = temp_t;
            nearest_hitPos = temp_hitPos;
            nearest_hitNormal = temp_hitNormal;
            nearest_hitMatID = Box[i].materialID;
        }
    }

    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////



    // One of the output results.
    hasHit = hasHitSomething;
    if ( !hasHitSomething ) return BACKGROUND_COLOR;

    vec3 I_local = vec3( 0.0 );  // Result color will be accumulated here.

    /////////////////////////////////////////////////////////////////////////////
    // TASK:
    // * Accumulate lighting from each light source on the nearest hit point. 
    //   They are all accumulated into I_local.
    // * For each light source, make a shadow ray, and check if the shadow ray
    //   intersects any of the objects (the planes and spheres) between the 
    //   nearest hit point and the light source.
    // * Then, call PhongLighting() to compute lighting for this light source.
    /////////////////////////////////////////////////////////////////////////////

    for (int i2 = 0 ; i2 < NUM_LIGHTS ; i2++) {
        vec3 shadow_ray_d = normalize( Light[i2].position - nearest_hitPos );
        Ray_t shadow_ray = Ray_t(nearest_hitPos + shadow_ray_d * DEFAULT_TMIN, shadow_ray_d);
        bool inShadow = false;
        bool temp_inShadow = false;

        float tmax_to_light = dot(shadow_ray_d, (Light[i2].position - nearest_hitPos));

        for (int j = 0 ; j < NUM_PLANES ; j++) {
            temp_inShadow = IntersectPlane(Plane[j], shadow_ray, DEFAULT_TMIN, tmax_to_light);
            if (temp_inShadow) {
                inShadow = temp_inShadow;
                break;
            }
        }

        if (!inShadow) {
             for (int k = 0 ; k < NUM_SPHERES ; k++) {
                 temp_inShadow = IntersectSphere(Sphere[k], shadow_ray, DEFAULT_TMIN, tmax_to_light);
                 if (temp_inShadow) {
                     inShadow = temp_inShadow;
                     break;
                 }
             }
        }

        if (!inShadow) {
             for (int m = 0 ; m < NUM_BOXES ; m++) {
                 temp_inShadow = IntersectBox(Box[m], shadow_ray, DEFAULT_TMIN, tmax_to_light);
                 if (temp_inShadow) {
                     inShadow = temp_inShadow;
                     break;
                 }
             }
        }
        // debug with default no shadow
        I_local += PhongLighting(shadow_ray.d, nearest_hitNormal, -ray.d, inShadow, 
                                 Material[nearest_hitMatID], Light[i2]);
            
    }
    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////



    // Populate output results.
    hitPos = nearest_hitPos;
    hitNormal = nearest_hitNormal;
    k_rg = Material[nearest_hitMatID].k_rg;

    return I_local;
}



/////////////////////////////////////////////////////////////////////////////
// Execution of fragment shader starts here.
// 1. Initializes the scene.
// 2. Compute a primary ray for the current pixel (fragment).
// 3. Trace ray into the scene with NUM_ITERATIONS recursion levels.
/////////////////////////////////////////////////////////////////////////////
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    InitScene();

    // Scale pixel 2D position such that its y coordinate is in [-1.0, 1.0].
    vec2 pixel_pos = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.y;

    // Set up camera coordinate frame in world space.
    vec3 cam_z_axis = normalize( cam_pos - cam_lookat );
    vec3 cam_x_axis = normalize( cross(cam_up_vec, cam_z_axis) );
    vec3 cam_y_axis = normalize( cross(cam_z_axis, cam_x_axis));

    // Create primary ray.
    float pixel_pos_z = -1.0 / tan(FOVY / 2.0);
    Ray_t pRay;
    pRay.o = cam_pos;
    pRay.d = normalize( pixel_pos.x * cam_x_axis  +  pixel_pos.y * cam_y_axis  +  pixel_pos_z * cam_z_axis );


    // Start Ray Tracing.
    // Use iterations to emulate the recursion.

    vec3 I_result = vec3( 0.0 );
    vec3 compounded_k_rg = vec3( 1.0 );
    Ray_t nextRay = pRay;

    for ( int level = 0; level <= NUM_ITERATIONS; level++ ) 
    {
        bool hasHit;
        vec3 hitPos, hitNormal, k_rg;

        vec3 I_local = CastRay( nextRay, hasHit, hitPos, hitNormal, k_rg );

        I_result += compounded_k_rg * I_local;

        if ( !hasHit ) break;

        compounded_k_rg *= k_rg;

        nextRay = Ray_t( hitPos, normalize( reflect(nextRay.d, hitNormal) ) );
    }

    fragColor = vec4( I_result, 1.0 );
}
